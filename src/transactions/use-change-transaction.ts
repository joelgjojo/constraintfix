import { executeTool, observe, recordRun, requestPlan, escalatePolicy } from '@/agent/run';
import { useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { AgentEvent, AgentPhase, AgentMode } from '@/agent/types';
import { providerForMode } from '@/agent/provider';
import { createOperationGate } from './interaction';
import { acceptance, applyOperations, createChangeReceipt, failureList, initialFixtures, newTransaction, restoreBaseline, sourceLabel, type ChangeReceipt, type ChangeSetCandidate, type ChangeTransaction, type FixtureState, type PolicyChoice, type VerificationMatrix } from './change-set';
import { verifyChangeSet } from '@/verification/change-set';
import { cloneConstraintContract, DEFAULT_CONSTRAINT_CONTRACT, type ConstraintContract } from '@/constraints/contract';
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useChangeTransaction(root: RefObject<HTMLDivElement>, mode: AgentMode, configuredContract: ConstraintContract = DEFAULT_CONSTRAINT_CONTRACT) {
  const [fixtures, setFixtures] = useState(initialFixtures);
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [tx, setTx] = useState<ChangeTransaction | null>(null);
  const [matrix, setMatrix] = useState<VerificationMatrix | null>(null);
  const [matrixLabel, setMatrixLabel] = useState('Awaiting browser measurements');
  const [receipt, setReceipt] = useState<ChangeReceipt | null>(null);
  const [contract, setContract] = useState(() => cloneConstraintContract(configuredContract));
  const [running, setRunning] = useState(false);
  const gate = useRef(createOperationGate());
  const currentPhase = useRef<AgentPhase>('idle');
  const move = (value: AgentPhase) => { currentPhase.current = value; setPhase(value); };
  const event = (phase: AgentPhase, title: string, detail: string, tone: AgentEvent['tone'] = 'neutral') => setEvents(e => [...e, { id: crypto.randomUUID(), timestamp: Date.now(), phase, title, detail, tone }]);
  const render = async (state: FixtureState) => {
    move('rendering');
    flushSync(() => setFixtures({ ...state }));
    // CSS colors settle before computed-style checks; all three fixtures commit together.
    await pause(260);
    if (!root.current || root.current.dataset.renderState !== JSON.stringify(state)) throw new Error('Atomic render did not commit.');
  };
  const tool = <T,>(record: ChangeTransaction, name: Parameters<typeof executeTool>[1], detail: string, execute: () => T | Promise<T>) => executeTool(record.agentRun, name, detail, execute, () => publish(record));
  const measure = async (record: ChangeTransaction, kind: ChangeTransaction['audits'][number]['kind']) => {
    if (!root.current) throw new Error('Missing browser verification surface.');
    move('verifying');
    const surface = root.current;
    const result = await tool(record, kind === 'rollback' ? 'verify_rollback' : 'verify_change_set', kind, () => verifyChangeSet(surface, record.contract));
    record.audits.push({ kind, result });
    observe(record.agentRun, kind, result, record.contract); publish(record);
    return result;
  };
  const publish = (record: ChangeTransaction) => setTx({ ...record, audits: [...record.audits], changeSet: { ...record.changeSet, candidates: [...record.changeSet.candidates] } });
  const decide = async (record: ChangeTransaction, feedback: VerificationMatrix, choice?: PolicyChoice): Promise<ChangeSetCandidate> => {
    move(choice ? 'replanning' : 'planning');
    const decision = await tool(record, 'plan_change_set', choice ? 'Replan from measured Candidate A feedback and human policy' : 'Initial bounded proposal', () => requestPlan(record, feedback, providerForMode(mode), choice));
    if (!decision.operations) throw new Error('Planner returned no multi-file operations.');
    record.modelCalls += decision.modelCalls ?? 0;
    if (decision.fallbackNotice) { record.notices.push(decision.fallbackNotice); recordRun(record.agentRun, 'decision', 'Bundled replay fallback', decision.fallbackNotice); event('planning', 'Replay fallback', decision.fallbackNotice, 'warning'); }
    record.changeSet.source = decision.source;
    return { id: choice ? 'candidate-b' : 'candidate-a', summary: decision.reason, source: decision.source, operations: decision.operations, status: 'proposed' };
  };
  const stopSafely = async (record: ChangeTransaction, error: unknown) => {
    if (record.baseline) {
      try {
        const restored = await tool(record, 'rollback_transaction', 'Failure recovery', async () => { const state = restoreBaseline(record); await render(state); return state; });
        const proof = await measure(record, 'rollback');
        record.rollbackCount += 1;
        record.rollback = { restored, verified: proof.overallPass, result: proof };
        setMatrix(proof); setMatrixLabel('Failure recovery · current baseline');
      } catch { event('failed', 'Recovery needs attention', 'Could not verify restoration. No candidate has been accepted.', 'danger'); }
    }
    record.status = 'failed'; recordRun(record.agentRun, 'failed', 'Run stopped safely', error instanceof Error ? error.message : 'Unknown error'); publish(record); move('failed');
    event('failed', 'Transaction stopped safely', error instanceof Error ? error.message : 'Verification could not complete.', 'danger');
  };
  const start = async () => {
    if (currentPhase.current !== 'idle' || !gate.current.tryAcquire()) return;
    setRunning(true);
    const record = newTransaction(mode === 'live' ? 'openai_live' : mode === 'replay' ? 'bundled_replay' : 'mock', configuredContract);
    setContract(record.contract); setEvents([]); setReceipt(null); setMatrix(null); publish(record);
    try {
      await tool(record, 'inspect_change_set', 'Read the three fixture targets and snapshotted contract', () => {
        if (!root.current || record.changeSet.files.some(f => !root.current!.querySelector(`[data-verifier="${f.id}"]`))) throw new Error('Missing change-set target.');
        return { files: record.changeSet.files, contract: record.contract };
      });
      await render(initialFixtures()); move('auditing');
      event('auditing', 'GOAL · three-file change request', 'Improve pricing and checkout while preserving accessibility, brand and mobile behavior.');
      const original = await measure(record, 'initial'); setMatrix(original); setMatrixLabel('Original render');
      event('auditing', 'Safe semantic repair · AUTO', 'The pricing info button lacks a name. Add aria-label before establishing the transaction baseline.');
      const baseline = { ...initialFixtures(), pricing: 1 };
      await tool(record, 'repair_accessible_name', 'Add pricing information aria-label and render baseline', () => render(baseline));
      const baselineResult = await measure(record, 'baseline');
      if (!baselineResult.overallPass) throw new Error('Cannot apply a change set without a verified baseline.');
      record.baseline = baseline;
      event('verifying', 'Verified baseline · 9/9', `Accessible names, protected surfaces and all ${record.contract.responsive.viewportWidth}px containers verified.`, 'success');
      const proposal = await decide(record, baselineResult);
      record.changeSet.candidates.push(proposal); publish(record);
      event('planning', `AGENT PROPOSAL · ${sourceLabel(proposal.source)}`, proposal.summary);
      move('patching');
      await tool(record, 'apply_change_set', 'Candidate A · validated operations across three fixtures', async () => { const next = applyOperations(baseline, proposal.operations); await render(next); }); event('rendering', 'EXECUTE · rendered one atomic change set', 'PricingCard.tsx + MobileHeader.tsx + CheckoutForm.tsx');
      await pause(900);
      const result = await measure(record, 'candidate-a');
      proposal.verification = result; proposal.status = acceptance(result);
      setMatrix(result); setMatrixLabel('Candidate A · measured before rollback');
      if (proposal.status !== 'rejected') throw new Error('This controlled proposal did not exhibit the expected regressions; inspect the fixtures.');
      record.status = 'rejected'; recordRun(record.agentRun, 'decision', 'Reject the entire candidate', failureList(result, record.contract).join(' · ')); publish(record); move('conflict');
      const pricing = result.fixtures.find(item => item.fixture === 'pricing-card')!;
      const header = result.fixtures.find(item => item.fixture === 'mobile-header')!;
      const form = result.fixtures.find(item => item.fixture === 'checkout-form')!;
      const formIssue = form.axeViolations[0];
      event('verifying', `ENVIRONMENTAL OBSERVATION · ${result.passed}/${result.total}`, `Pricing contrast ${pricing.contrastRatio.toFixed(2)}:1; brand ${pricing.brandColor}. Header ${header.scrollWidth}px > ${header.width}px. Form axe ${formIssue?.id ?? 'none'} · ${formIssue?.impact ?? 'none'} · ${formIssue?.nodes ?? 0} node.`, 'warning');
      event('conflict', 'DETERMINISTIC FAILURE · CHANGE SET REJECTED', failureList(result, record.contract).join(' · '), 'danger');
      await pause(1600);
      event('replanning', 'ROLLING BACK 3-FILE CHANGE SET', 'Restoring one verified snapshot atomically; no partial acceptance.', 'warning');
      const restored = await tool(record, 'rollback_transaction', 'Candidate A rejected by measured gates', async () => { const state = restoreBaseline(record); await render(state); return state; });
      const proof = await measure(record, 'rollback');
      record.rollbackCount += 1; record.rollback = { restored, verified: proof.overallPass, result: proof };
      if (!proof.overallPass) throw new Error('Rollback did not restore all required checks.');
      event('verifying', 'ROLLBACK COMPLETE · BASELINE RE-VERIFIED', `${proof.passed}/${proof.total} checks passed. All three fixture states restored.`, 'success');
      await tool(record, 'request_human_policy', 'One protected-brand boundary; routine repairs remain autonomous', () => escalatePolicy(record, result));
      publish(record); move('waiting_for_human');
      event('waiting_for_human', 'VERIFIER FEEDBACK · HUMAN POLICY REQUIRED', 'Brand changes need approval. Header overflow and broken form semantics must be repaired either way.', 'warning');
    } catch (error) { await stopSafely(record, error); }
    finally { gate.current.release(); setRunning(false); }
  };
  const resolve = async (choice: PolicyChoice) => {
    if (currentPhase.current !== 'waiting_for_human' || !tx || !gate.current.tryAcquire()) return;
    setRunning(true);
    const record: ChangeTransaction = { ...tx, audits: [...tx.audits], changeSet: { ...tx.changeSet, candidates: [...tx.changeSet.candidates] }, notices: [...tx.notices], humanChoice: choice };
    try {
      record.status = 'running';
      const escalation = record.agentRun.humanEscalations[0];
      if (!escalation || escalation.choice) throw new Error('No unresolved policy escalation.');
      escalation.choice = choice;
      recordRun(record.agentRun, 'human', 'Human policy received', choice.replaceAll('_', ' '));
      event('replanning', choice === 'preserve_brand' ? 'Human policy · preserve brand' : 'Human policy · brand exception only', 'Replanning all three files from measured Candidate A feedback.');
      const feedback = record.changeSet.candidates[0].verification!;
      const proposal = await decide(record, feedback, choice);
      record.changeSet.candidates.push(proposal); record.status = 'running'; publish(record);
      move('patching');
      await tool(record, 'apply_change_set', 'Candidate B · revised plan', async () => { const next = applyOperations(restoreBaseline(record), proposal.operations, choice); await render(next); }); event('rendering', 'Candidate B · all three files rendered', proposal.summary);
      await pause(850);
      const final = await measure(record, 'candidate-b');
      proposal.verification = final; proposal.status = acceptance(final, choice);
      setMatrix(final); setMatrixLabel('Candidate B · current rendered result');
      if (proposal.status === 'rejected') throw new Error('Replan failed a required constraint. Entire change set rejected.');
      recordRun(record.agentRun, 'decision', proposal.status === 'accepted' ? 'Accept verified candidate' : 'Accept with explicit brand exception', `${final.passed}/${final.total} measured gates · ${choice}`);
      record.status = proposal.status; record.completedAt = new Date().toISOString(); publish(record);
      const generated = await tool(record, 'generate_constraint_receipt', 'Only after deterministic acceptance or approved exception', () => createChangeReceipt(record));
      recordRun(record.agentRun, 'complete', 'Review workflow complete', 'Contract, measurements, policy decision and tool trace documented.');
      setReceipt({ ...generated, agentRun: structuredClone(record.agentRun) }); publish(record); move('complete');
      event('complete', record.status === 'accepted' ? 'CHANGE SET ACCEPTED · VERIFIED' : 'COMPLETED WITH APPROVED EXCEPTION', `${final.passed}/${final.total} measured checks pass. ${record.status === 'accepted' ? 'Every required gate satisfied.' : 'Only PricingCard brand is waived; it remains FAIL.'}`, record.status === 'accepted' ? 'success' : 'warning');
    } catch (error) { await stopSafely(record, error); }
    finally { gate.current.release(); setRunning(false); }
  };
  const reset = () => {
    if (gate.current.isLocked()) return;
    setFixtures(initialFixtures()); setContract(cloneConstraintContract(configuredContract)); move('idle'); setEvents([]); setTx(null); setMatrix(null); setMatrixLabel('Awaiting browser measurements'); setReceipt(null); setRunning(false);
  };
  return { fixtures, contract, phase, events, tx, matrix, matrixLabel, receipt, running, start, resolve, reset };
}
