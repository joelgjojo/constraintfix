import type { DecisionSource, VerificationResult } from '@/agent/types';

export const files = [
  { id: 'pricing-card', name: 'PricingCard.tsx', short: 'Pricing' },
  { id: 'mobile-header', name: 'MobileHeader.tsx', short: 'Header' },
  { id: 'checkout-form', name: 'CheckoutForm.tsx', short: 'Form' },
] as const;
export type FixtureId = typeof files[number]['id'];
export type PolicyChoice = 'preserve_brand' | 'allow_change';
export type Operation =
  | { fixture: 'pricing-card'; action: 'darken_cta' | 'change_text_color' }
  | { fixture: 'mobile-header'; action: 'expanded_navigation' | 'mobile_safe_navigation' }
  | { fixture: 'checkout-form'; action: 'compact_field' | 'associate_label' };
export interface FixtureState {
  pricing: number;
  header: 'compact' | 'expanded' | 'mobile-safe';
  checkout: 'associated' | 'visual-only' | 'repaired';
}
export const initialFixtures = (): FixtureState => ({ pricing: 0, header: 'compact', checkout: 'associated' });
export const changeRequest = 'Improve the pricing and checkout experience while preserving accessibility, brand identity and mobile behavior.';
export interface ChangeSetCandidate {
  id: 'candidate-a' | 'candidate-b';
  summary: string;
  source: DecisionSource;
  operations: Operation[];
  status: 'proposed' | 'rejected' | 'accepted' | 'approved_exception';
  verification?: VerificationMatrix;
}
export interface ChangeSet {
  id: string;
  request: string;
  source: DecisionSource;
  files: typeof files;
  candidates: ChangeSetCandidate[];
}
export interface FixtureVerification extends VerificationResult {
  fixture: FixtureId;
  width: number;
  scrollWidth: number;
  semanticsPass: boolean;
}
export interface VerificationMatrix {
  fixtures: FixtureVerification[];
  passed: number;
  total: number;
  overallPass: boolean;
  measuredAt: string;
}
export interface AuditRecord { kind: 'initial' | 'baseline' | 'candidate-a' | 'rollback' | 'candidate-b'; result: VerificationMatrix }
export interface ChangeTransaction {
  id: string;
  startedAt: string;
  completedAt?: string;
  changeSet: ChangeSet;
  status: 'running' | 'rejected' | 'waiting_for_human' | 'accepted' | 'approved_exception' | 'failed';
  baseline?: FixtureState;
  rollback?: { restored: FixtureState; verified: boolean; result: VerificationMatrix };
  audits: AuditRecord[];
  rollbackCount: number;
  humanChoice?: PolicyChoice;
  modelCalls: number;
  notices: string[];
}
export function operationsFor(choice?: PolicyChoice): Operation[] {
  return [
    { fixture: 'pricing-card', action: choice === 'preserve_brand' ? 'change_text_color' : 'darken_cta' },
    { fixture: 'mobile-header', action: choice ? 'mobile_safe_navigation' : 'expanded_navigation' },
    { fixture: 'checkout-form', action: choice ? 'associate_label' : 'compact_field' },
  ];
}
export function validOperations(value: unknown, choice?: PolicyChoice): value is Operation[] {
  if (!Array.isArray(value) || value.length !== files.length) return false;
  const expected = operationsFor(choice);
  return expected.every(op => value.filter(item => item && item.fixture === op.fixture && item.action === op.action && Object.keys(item).length === 2).length === 1);
}
/** Validate the entire proposal before deriving any fixture state. Never execute model code. */
export function applyOperations(before: FixtureState, operations: Operation[], choice?: PolicyChoice): FixtureState {
  if (!validOperations(operations, choice)) throw new Error('Rejected malformed or out-of-policy multi-file operations.');
  const next = { ...before };
  for (const op of operations) {
    if (op.fixture === 'pricing-card') next.pricing = op.action === 'darken_cta' ? 2 : 3;
    if (op.fixture === 'mobile-header') next.header = op.action === 'expanded_navigation' ? 'expanded' : 'mobile-safe';
    if (op.fixture === 'checkout-form') next.checkout = op.action === 'compact_field' ? 'visual-only' : 'repaired';
  }
  return next;
}
export function aggregateVerification(results: FixtureVerification[]): VerificationMatrix {
  if (results.length !== files.length || !files.every(file => results.filter(r => r.fixture === file.id).length === 1)) throw new Error('Every fixture must be verified exactly once.');
  const passed = results.reduce((n, r) => n + Number(r.accessibilityPass) + Number(r.brandPass) + Number(r.layoutPass), 0);
  return { fixtures: results, passed, total: results.length * 3, overallPass: passed === results.length * 3, measuredAt: new Date().toISOString() };
}
export function acceptance(result: VerificationMatrix, choice?: PolicyChoice): 'accepted' | 'approved_exception' | 'rejected' {
  if (result.overallPass) return 'accepted';
  const onlyApprovedBrandFailure = result.fixtures.every(r => r.accessibilityPass && r.layoutPass && r.semanticsPass && (r.brandPass || r.fixture === 'pricing-card'));
  return choice === 'allow_change' && onlyApprovedBrandFailure ? 'approved_exception' : 'rejected';
}
export function restoreBaseline(tx: ChangeTransaction): FixtureState {
  if (!tx.baseline) throw new Error('No verified baseline to restore.');
  return { ...tx.baseline };
}
export function newTransaction(source: DecisionSource): ChangeTransaction {
  const id = crypto.randomUUID();
  return { id, startedAt: new Date().toISOString(), status: 'running', changeSet: { id: `CS-${id.slice(0, 8)}`, request: changeRequest, source, files, candidates: [] }, audits: [], rollbackCount: 0, modelCalls: 0, notices: [] };
}
export function failureList(matrix: VerificationMatrix): string[] {
  return matrix.fixtures.flatMap(r => [!r.accessibilityPass && `Accessibility / ${r.fixture}`, !r.brandPass && `Brand / ${r.fixture}`, !r.layoutPass && `375px layout / ${r.fixture}`].filter((v): v is string => Boolean(v)));
}
export function createChangeReceipt(tx: ChangeTransaction) {
  if (!['accepted', 'approved_exception'].includes(tx.status) || !tx.completedAt) throw new Error('Cannot receipt an unfinished change set.');
  const final = tx.audits.at(-1)!.result;
  if (acceptance(final, tx.humanChoice) !== tx.status) throw new Error('Receipt outcome must match deterministic proof.');
  return {
    schemaVersion: 2,
    receiptId: `CF-${tx.id.slice(0, 8)}`,
    transactionId: tx.id,
    changeRequest: tx.changeSet.request,
    generatedAt: tx.completedAt,
    source: tx.changeSet.source,
    filesTouched: tx.changeSet.files.map(f => f.name),
    candidateHistory: tx.changeSet.candidates,
    audits: tx.audits,
    rollback: tx.rollback,
    humanDecision: tx.humanChoice,
    approvedExceptions: tx.status === 'approved_exception' ? [{ fixture: 'pricing-card', rule: 'protected-brand', expected: '#60A5FA', actual: final.fixtures.find(r => r.fixture === 'pricing-card')!.brandColor }] : [],
    finalVerification: final,
    outcome: tx.status,
    evaluation: {
      attempts: tx.changeSet.candidates.length,
      filesTouched: tx.changeSet.files.length,
      candidateChecks: tx.changeSet.candidates.reduce((n, c) => n + (c.verification?.total ?? 0), 0),
      totalMeasuredChecks: tx.audits.reduce((n, audit) => n + audit.result.total, 0),
      rejectedCandidates: tx.changeSet.candidates.filter(c => c.status === 'rejected').length,
      rollbacks: tx.rollbackCount,
      restoredFixtures: tx.rollback?.verified ? tx.changeSet.files.length : 0,
      humanDecisions: tx.humanChoice ? 1 : 0,
      modelCalls: tx.modelCalls,
      finalChecks: `${final.passed}/${final.total}`,
      elapsedMs: Date.parse(tx.completedAt) - Date.parse(tx.startedAt),
    },
    scope: 'Controlled browser fixtures; React state rollback; selected automated checks, not full WCAG or CI certification.',
  };
}
export type ChangeReceipt = ReturnType<typeof createChangeReceipt>;
export const sourceLabel = (source: DecisionSource) => source === 'openai_live' ? 'Optional live connector' : source === 'bundled_replay' ? 'Bundled replay' : 'Mock';
