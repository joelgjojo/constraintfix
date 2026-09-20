import assert from 'node:assert/strict';
import { test } from 'node:test';
import { agentGoal, executeTool, observe, escalatePolicy, requestPlan, automationSummary } from '../src/agent/run';
import { acceptance, aggregateVerification, applyOperations, createChangeReceipt, files, initialFixtures, newTransaction, operationsFor, restoreBaseline, type FixtureVerification } from '../src/transactions/change-set';
import { replayAgent } from '../src/agent/replay-agent';
import { __testables as server } from '../api/codex/decision.js';

const measured = () => files.map(f => ({ fixture: f.id, width: 375, scrollWidth: 375, semanticsPass: true, accessibilityPass: true, axeViolations: [], contrastPass: true, contrastRatio: 7.02, brandPass: true, brandColor: 'rgb(96, 165, 250)', layoutPass: true } satisfies FixtureVerification));
const failures = () => {
  const rows: FixtureVerification[] = measured();
  rows[0].brandPass = false; rows[0].brandColor = 'rgb(37, 99, 235)';
  rows[1].layoutPass = false; rows[1].scrollWidth = 540;
  rows[2].accessibilityPass = false; rows[2].semanticsPass = false;
  rows[2].axeViolations = [{ id: 'label', impact: 'critical', nodes: 1, help: 'Form elements must have labels' }];
  return aggregateVerification(rows);
};
test('AgentRun composes around its transaction with a goal and operational plan before tools', () => {
  const tx = newTransaction('bundled_replay');
  assert.equal(tx.agentRun.transactionId, tx.id);
  assert.equal(tx.agentRun.goal, agentGoal);
  assert.equal(tx.agentRun.plan.length, 7);
  assert.deepEqual(tx.agentRun.trace.map(e => e.kind), ['goal', 'plan']);
});
test('tool trace records real invocation order and failed operations honestly', async () => {
  const tx = newTransaction('bundled_replay'); let state = initialFixtures();
  await executeTool(tx.agentRun, 'apply_change_set', 'A', () => { state = applyOperations(state, operationsFor()); });
  assert.equal(state.header, 'expanded');
  await assert.rejects(executeTool(tx.agentRun, 'rollback_transaction', 'No baseline', () => restoreBaseline(tx)));
  const calls = tx.agentRun.trace.filter(e => e.kind === 'tool');
  assert.deepEqual(calls.map(e => [e.tool, e.status]), [['apply_change_set', 'succeeded'], ['rollback_transaction', 'failed']]);
  assert.ok(calls.every(e => e.completedAt));
  assert.throws(() => createChangeReceipt(tx));
});
test('failed observations support rejection, real snapshot restoration and exactly one policy escalation', async () => {
  const tx = newTransaction('bundled_replay'); const bad = failures();
  tx.baseline = { ...initialFixtures(), pricing: 1 };
  observe(tx.agentRun, 'candidate-a', bad, tx.contract);
  assert.equal(acceptance(bad), 'rejected');
  assert.throws(() => escalatePolicy(tx, bad));
  const restored = await executeTool(tx.agentRun, 'rollback_transaction', 'Rejected A', () => restoreBaseline(tx));
  assert.deepEqual(restored, tx.baseline);
  tx.rollback = { restored, verified: true, result: aggregateVerification(measured()) };
  assert.throws(() => escalatePolicy(tx, aggregateVerification(measured())));
  escalatePolicy(tx, bad);
  assert.equal(tx.status, 'waiting_for_human');
  assert.equal(tx.agentRun.humanEscalations.length, 1);
  assert.throws(() => escalatePolicy(tx, bad));
});
test('the exact visible verifier-feedback object and human choice reach the replan provider and live prompt', async () => {
  const tx = newTransaction('bundled_replay'); const bad = failures();
  await requestPlan(tx, bad, { label: 'Capturing provider', async decide(input) {
    assert.equal(input, tx.agentRun.replan!.input);
    assert.equal(input.humanChoice, 'preserve_brand');
    assert.equal(input.changeSet!.feedback, bad);
    const observations = input.changeSet!.observations!;
    assert.equal(observations.failedChecks, 3);
    assert.equal(observations.fixtures[0].brand.actual, 'rgb(37, 99, 235)');
    assert.equal(observations.fixtures[1].responsive.scrollWidth, 540);
    assert.equal(observations.fixtures[2].accessibility.violations[0].id, 'label');
    assert.match(server.planningPrompt(input), /Structured verifier feedback/);
    assert.match(server.planningPrompt(input), /540/);
    return { type: 'replan', action: 'change_text_color', source: 'bundled_replay', risk: 'low', reason: 'Bounded replan', operations: operationsFor(input.humanChoice) };
  } }, 'preserve_brand');
  assert.deepEqual(tx.agentRun.replan!.operations, operationsFor('preserve_brand'));
});
test('bundled planning makes zero fetches while executor and verification callbacks still execute', async () => {
  const tx = newTransaction('bundled_replay'); const originalFetch = globalThis.fetch;
  let fetches = 0, verifierRuns = 0; let state = initialFixtures();
  globalThis.fetch = async () => { fetches++; throw new Error('Offline'); };
  try {
    const decision = await requestPlan(tx, failures(), replayAgent, 'preserve_brand');
    await executeTool(tx.agentRun, 'apply_change_set', 'B', () => { state = applyOperations(state, decision.operations!, 'preserve_brand'); });
    const result = await executeTool(tx.agentRun, 'verify_change_set', 'Injected verifier for orchestration test', () => { verifierRuns++; return aggregateVerification(measured()); });
    assert.equal(state.checkout, 'repaired'); assert.equal(verifierRuns, 1); assert.equal(fetches, 0);
    assert.equal(result.passed, 9); assert.equal(decision.source, 'bundled_replay');
  } finally { globalThis.fetch = originalFetch; }
});
test('automation metrics reflect executed audits and candidates, not forecasts', () => {
  const tx = newTransaction('bundled_replay');
  assert.equal(automationSummary(tx, false).filesReviewed, 0);
  assert.equal(automationSummary(tx, false).pendingChecks, null);
  tx.audits.push({ kind: 'candidate-a', result: failures() });
  tx.changeSet.candidates.push({ id: 'candidate-a', source: 'bundled_replay', summary: 'A', operations: operationsFor(), status: 'rejected', verification: failures() });
  const summary = automationSummary(tx, false);
  assert.equal(summary.filesReviewed, 3); assert.equal(summary.candidateChecks, 9);
  assert.equal(summary.rejectedCandidates, 1); assert.equal(summary.rollbacks, 0);
  assert.equal(summary.escalations, 0); assert.equal(summary.receiptGenerated, false);
});
