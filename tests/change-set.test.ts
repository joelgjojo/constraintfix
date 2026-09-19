import assert from 'node:assert/strict';
import { test } from 'node:test';
import { acceptance, aggregateVerification, applyOperations, createChangeReceipt, files, initialFixtures, newTransaction, operationsFor, restoreBaseline, validOperations, type FixtureVerification } from '../src/transactions/change-set';
import { mockAgent } from '../src/agent/mock-agent';
import { replayAgent } from '../src/agent/replay-agent';
import { __testables as server } from '../api/codex/decision.js';

const checks = (): FixtureVerification[] => files.map(f => ({ fixture: f.id, width: 375, scrollWidth: 375, semanticsPass: true, accessibilityPass: true, axeViolations: [], contrastPass: true, contrastRatio: 7.02, brandPass: true, brandColor: 'rgb(96, 165, 250)', layoutPass: true }));
const baseline = { ...initialFixtures(), pricing: 1 };

test('multi-file executor validates every operation before changing any fixture', () => {
  assert.deepEqual(applyOperations(baseline, operationsFor()), {pricing:2,header:'expanded',checkout:'visual-only'});
  assert.deepEqual(baseline, {pricing:1,header:'compact',checkout:'associated'});
  for (const bad of [operationsFor().slice(0,2), [operationsFor()[0], operationsFor()[0], operationsFor()[2]], [...operationsFor(), {fixture:'unknown',action:'inject_css'}]]) {
    assert.equal(validOperations(bad), false);
    assert.throws(() => applyOperations(baseline, bad as ReturnType<typeof operationsFor>));
  }
  assert.deepEqual(applyOperations(baseline, operationsFor('preserve_brand'),'preserve_brand'),{pricing:3,header:'mobile-safe',checkout:'repaired'});
});
test('each of nine independently failed gates rejects the whole change set', () => {
  for (let file=0;file<3;file++) for (const rule of ['accessibilityPass','brandPass','layoutPass'] as const) {
    const result=checks(); result[file][rule]=false;
    const matrix=aggregateVerification(result);
    assert.equal(matrix.passed,8); assert.equal(acceptance(matrix),'rejected');
  }
  assert.throws(() => aggregateVerification(checks().slice(0,2)));
  assert.throws(() => aggregateVerification([checks()[0],checks()[0],checks()[2]]));
});
test('rollback restores all fixture states without sharing the saved snapshot', () => {
  const tx=newTransaction('mock'); tx.baseline={...baseline};
  const candidate=applyOperations(baseline,operationsFor());
  const restored=restoreBaseline(tx);
  assert.notDeepEqual(candidate,restored); assert.deepEqual(restored,baseline);
  restored.header='expanded'; assert.equal(tx.baseline.header,'compact');
  assert.deepEqual(initialFixtures(),{pricing:0,header:'compact',checkout:'associated'});
});
test('approved exception waives only pricing brand, never header layout or form semantics', () => {
  const result=checks(); result[0].brandPass=false; result[0].brandColor='rgb(37, 99, 235)';
  assert.equal(acceptance(aggregateVerification(result),'allow_change'),'approved_exception');
  result[1].layoutPass=false;
  assert.equal(acceptance(aggregateVerification(result),'allow_change'),'rejected');
  result[1].layoutPass=true; result[2].accessibilityPass=false; result[2].semanticsPass=false;
  assert.equal(acceptance(aggregateVerification(result),'allow_change'),'rejected');
});
test('receipt aggregates actual audits, candidates, rollback and explicit exceptions', () => {
  for (const choice of ['preserve_brand','allow_change'] as const) {
    const tx=newTransaction('mock'); tx.baseline={...baseline}; tx.humanChoice=choice;
    const bad=checks();bad[0].brandPass=false;bad[1].layoutPass=false;bad[2].accessibilityPass=false;bad[2].semanticsPass=false;
    const rejected=aggregateVerification(bad), good=aggregateVerification(checks());
    const finalChecks=checks(); if(choice==='allow_change'){finalChecks[0].brandPass=false;finalChecks[0].brandColor='rgb(37, 99, 235)';}
    const final=aggregateVerification(finalChecks); tx.status=acceptance(final,choice); tx.completedAt=new Date().toISOString();
    tx.changeSet.candidates=[{id:'candidate-a',summary:'A',source:'mock',operations:operationsFor(),status:'rejected',verification:rejected},{id:'candidate-b',summary:'B',source:'mock',operations:operationsFor(choice),status:tx.status==='rejected'?'rejected':tx.status,verification:final}];
    tx.audits=[{kind:'initial',result:good},{kind:'baseline',result:good},{kind:'candidate-a',result:rejected},{kind:'rollback',result:good},{kind:'candidate-b',result:final}];
    tx.rollbackCount=1;tx.rollback={restored:restoreBaseline(tx),verified:true,result:good};
    const receipt=JSON.parse(JSON.stringify(createChangeReceipt(tx)));
    assert.equal(receipt.evaluation.candidateChecks,18);assert.equal(receipt.evaluation.totalMeasuredChecks,45);
    assert.equal(receipt.evaluation.restoredFixtures,3);assert.equal(receipt.evaluation.rejectedCandidates,1);
    assert.equal(receipt.evaluation.finalChecks,choice==='preserve_brand'?'9/9':'8/9');
    assert.equal(receipt.approvedExceptions.length,choice==='preserve_brand'?0:1);
  }
  assert.throws(()=>createChangeReceipt(newTransaction('mock')));
});
test('MOCK and REPLAY produce validated multi-file proposals without fetching', async () => {
  const previous=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;throw new Error('Offline mode must never fetch');};
  try {for(const provider of [mockAgent,replayAgent]) for(const choice of [undefined,'preserve_brand','allow_change'] as const){
    const input={phase:'planning' as const,stage:choice?2:1,verification:null,humanChoice:choice,changeSet:{request:'Checkout redesign',feedback:aggregateVerification(checks())}};
    const decision=await provider.decide(input);
    assert.ok(validOperations(decision.operations,choice));assert.equal(decision.modelCalls??0,0);
    assert.deepEqual(server.expectedOperations(input),operationsFor(choice));
  }assert.equal(calls,0);}finally{globalThis.fetch=previous;}
});
