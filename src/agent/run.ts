import type { AgentDecisionInput, AgentProvider, DecisionSource } from './types';
import type { ConstraintContract } from '@/constraints/contract';
import type { ChangeTransaction, PolicyChoice, VerificationMatrix } from '@/transactions/change-set';

export const agentGoal = "Review the proposed 3-file frontend change and make it safe under the organization's Constraint Contract.";
export const operationalPlan = [
  'Inspect the change set and snapshot its contract',
  'Audit and repair low-risk semantics; verify a safe baseline',
  'Plan and apply the candidate atomically',
  'Measure accessibility, brand and responsive behavior',
  'Reject unsafe work, restore all fixtures and verify rollback',
  'Escalate protected policy; feed observations into replanning',
  'Apply the revised plan, re-verify and document the outcome',
] as const;

export const agentTools = {
  inspect_change_set: 'Inspect change set and contract',
  repair_accessible_name: 'Repair accessible name',
  plan_change_set: 'Request planner decision',
  apply_change_set: 'Apply and render change set',
  verify_change_set: 'Run accessibility, brand and responsive verifiers',
  rollback_transaction: 'Restore and render transaction baseline',
  verify_rollback: 'Re-run all verifiers after rollback',
  request_human_policy: 'Request protected-brand policy',
  generate_constraint_receipt: 'Generate constraint receipt',
} as const;
export type ToolName = keyof typeof agentTools;
export interface VerifierFeedback {
  measuredAt: string;
  failedChecks: number;
  fixtures: Array<{
    fixture: string;
    accessibility: { pass: boolean; contrast: number; minimumContrast: number; violations: VerificationMatrix['fixtures'][number]['axeViolations'] };
    brand: { pass: boolean; expected: string; actual: string };
    responsive: { pass: boolean; expectedViewport: number; viewport: number; scrollWidth: number };
  }>;
}
export interface RunEntry {
  id: number;
  kind: 'goal' | 'plan' | 'tool' | 'observation' | 'decision' | 'escalation' | 'human' | 'replan' | 'complete' | 'failed';
  title: string;
  detail: string;
  startedAt: string;
  completedAt?: string;
  tool?: ToolName;
  status?: 'running' | 'succeeded' | 'failed';
  observation?: VerifierFeedback;
}
export interface AgentRun {
  transactionId: string;
  goal: string;
  plan: readonly string[];
  trace: RunEntry[];
  humanEscalations: Array<{ reason: string; choice?: PolicyChoice }>;
  replan?: { input: AgentDecisionInput; source?: DecisionSource; operations?: import('@/transactions/change-set').Operation[] };
}
export function recordRun(run: AgentRun, kind: RunEntry['kind'], title: string, detail: string) {
  const entry: RunEntry = { id: run.trace.length + 1, kind, title, detail, startedAt: new Date().toISOString() };
  run.trace.push(entry);
  return entry;
}
export function newAgentRun(transactionId: string): AgentRun {
  const run: AgentRun = { transactionId, goal: agentGoal, plan: [...operationalPlan], trace: [], humanEscalations: [] };
  recordRun(run, 'goal', 'Review the proposed frontend change', agentGoal);
  recordRun(run, 'plan', 'Operational plan · derived from the bounded workflow', operationalPlan.join(' → '));
  return run;
}
/** The trace surrounds execution. A thrown operation can never be logged as succeeded. */
export async function executeTool<T>(run: AgentRun, tool: ToolName, detail: string, execute: () => T | Promise<T>, changed: () => void = () => {}) {
  const entry = recordRun(run, 'tool', agentTools[tool], detail);
  entry.tool = tool; entry.status = 'running'; changed();
  try {
    const result = await execute();
    entry.status = 'succeeded'; entry.completedAt = new Date().toISOString(); changed();
    return result;
  } catch (error) {
    entry.status = 'failed'; entry.completedAt = new Date().toISOString();
    entry.detail += ` · ${error instanceof Error ? error.message : 'Operation failed'}`;
    changed(); throw error;
  }
}
export function verifierFeedback(matrix: VerificationMatrix, contract: ConstraintContract): VerifierFeedback {
  return {
    measuredAt: matrix.measuredAt, failedChecks: matrix.total - matrix.passed,
    fixtures: matrix.fixtures.map(r => ({
      fixture: r.fixture,
      accessibility: { pass: r.accessibilityPass, contrast: r.contrastRatio, minimumContrast: contract.accessibility.minimumContrast, violations: r.axeViolations.map(v => ({ ...v })) },
      brand: { pass: r.brandPass, expected: contract.brand.protectedPrimaryRgb, actual: r.brandColor },
      responsive: { pass: r.layoutPass, expectedViewport: contract.responsive.viewportWidth, viewport: r.width, scrollWidth: r.scrollWidth },
    })),
  };
}
export function observe(run: AgentRun, kind: string, matrix: VerificationMatrix, contract: ConstraintContract) {
  const feedback = verifierFeedback(matrix, contract);
  const entry = recordRun(run, 'observation', `${kind} · ${matrix.passed}/${matrix.total} measured gates`, feedback.fixtures.map(f => `${f.fixture}: accessibility ${f.accessibility.pass ? 'PASS' : 'FAIL'}, brand ${f.brand.pass ? 'PASS' : 'FAIL'}, layout ${f.responsive.pass ? 'PASS' : 'FAIL'}`).join(' · '));
  entry.observation = feedback;
  return feedback;
}
export function escalatePolicy(tx: ChangeTransaction, matrix: VerificationMatrix) {
  if (!tx.rollback?.verified) throw new Error('Policy escalation requires verified rollback.');
  if (tx.contract.autonomy.protectedConstraintChange !== 'ask' || !matrix.fixtures.some(f => !f.brandPass)) throw new Error('No protected-brand policy boundary to escalate.');
  if (tx.agentRun.humanEscalations.length) throw new Error('Policy escalation already requested.');
  tx.agentRun.humanEscalations.push({ reason: 'Protected brand changed. Choose preservation or an explicit pricing-brand exception.' });
  recordRun(tx.agentRun, 'escalation', 'Human judgment required', 'Protected brand changed. Baseline restored and verified; routine repairs remain autonomous.');
  tx.status = 'waiting_for_human';
}
/** This exact input is both visible in the run and delivered to the selected provider. */
export async function requestPlan(tx: ChangeTransaction, matrix: VerificationMatrix, provider: AgentProvider, choice?: PolicyChoice) {
  const input: AgentDecisionInput = {
    phase: choice ? 'replanning' : 'planning', stage: choice ? 2 : 1,
    humanChoice: choice, transactionId: tx.id, verification: matrix.fixtures[0],
    changeSet: { request: tx.changeSet.request, feedback: matrix, observations: verifierFeedback(matrix, tx.contract) },
  };
  if (choice) {
    tx.agentRun.replan = { input };
    recordRun(tx.agentRun, 'replan', 'Replan input', `${input.changeSet!.observations!.failedChecks} failed gates · human policy: ${choice.replaceAll('_', ' ')}`);
  }
  const decision = await provider.decide(input);
  if (choice && tx.agentRun.replan) {
    tx.agentRun.replan.source = decision.source;
    tx.agentRun.replan.operations = decision.operations;
  }
  return decision;
}
export function automationSummary(tx: ChangeTransaction, receiptGenerated: boolean) {
  const final = tx.audits.at(-1)?.result;
  return {
    filesReviewed: new Set(tx.audits.flatMap(a => a.result.fixtures.map(f => f.fixture))).size,
    candidateChecks: tx.changeSet.candidates.reduce((n, c) => n + (c.verification?.total ?? 0), 0),
    rejectedCandidates: tx.changeSet.candidates.filter(c => c.status === 'rejected').length,
    rollbacks: tx.rollbackCount,
    escalations: tx.agentRun.humanEscalations.length,
    pendingChecks: receiptGenerated && final ? Math.max(0, tx.changeSet.files.length * 3 - final.fixtures.reduce((count, f) => count + [f.accessibilityPass, f.brandPass, f.layoutPass].filter(value => typeof value === 'boolean').length, 0)) : null,
    failedChecks: final ? final.total - final.passed : null,
    receiptGenerated,
  };
}
