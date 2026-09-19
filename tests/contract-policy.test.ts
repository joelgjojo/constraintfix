import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cloneConstraintContract, DEFAULT_CONSTRAINT_CONTRACT } from '../src/constraints/contract';
import { newTransaction } from '../src/transactions/change-set';
import { evaluatePolicyMeasurements, type PolicyMeasurements } from '../src/verification/policy';

const measurements = (): PolicyMeasurements => ({
  contrastRatio: 5.17,
  selectedViolationCount: 0,
  brandColor: DEFAULT_CONSTRAINT_CONTRACT.brand.protectedPrimaryRgb,
  viewportWidth: DEFAULT_CONSTRAINT_CONTRACT.responsive.viewportWidth,
  horizontalOverflow: false,
});

test('contrast verdict changes when the snapshotted threshold changes', () => {
  const measured = measurements();
  assert.equal(evaluatePolicyMeasurements(measured, DEFAULT_CONSTRAINT_CONTRACT).contrastPass, true);
  const strict = cloneConstraintContract(DEFAULT_CONSTRAINT_CONTRACT);
  strict.accessibility.minimumContrast = 7;
  assert.equal(evaluatePolicyMeasurements(measured, strict).contrastPass, false);
  assert.equal(evaluatePolicyMeasurements(measured, strict).accessibilityPass, false);
});

test('brand verdict changes when the expected computed color changes', () => {
  const measured = measurements();
  assert.equal(evaluatePolicyMeasurements(measured, DEFAULT_CONSTRAINT_CONTRACT).brandPass, true);
  const changed = cloneConstraintContract(DEFAULT_CONSTRAINT_CONTRACT);
  changed.brand.protectedPrimaryRgb = 'rgb(15, 23, 42)';
  assert.equal(evaluatePolicyMeasurements(measured, changed).brandPass, false);
});

test('viewport verdict compares real measurements with the supplied contract width', () => {
  const measured375 = measurements();
  const measured600 = { ...measurements(), viewportWidth: 600 };
  const contract600 = cloneConstraintContract(DEFAULT_CONSTRAINT_CONTRACT);
  contract600.responsive.viewportWidth = 600;
  assert.equal(evaluatePolicyMeasurements(measured375, DEFAULT_CONSTRAINT_CONTRACT).viewportPass, true);
  assert.equal(evaluatePolicyMeasurements(measured600, DEFAULT_CONSTRAINT_CONTRACT).viewportPass, false);
  assert.equal(evaluatePolicyMeasurements(measured600, contract600).viewportPass, true);
  assert.equal(evaluatePolicyMeasurements(measured375, contract600).viewportPass, false);
});

test('overflow policy is enforced by the supplied contract', () => {
  const overflowing = { ...measurements(), horizontalOverflow: true };
  assert.equal(evaluatePolicyMeasurements(overflowing, DEFAULT_CONSTRAINT_CONTRACT).layoutPass, false);
  const permissive = cloneConstraintContract(DEFAULT_CONSTRAINT_CONTRACT);
  permissive.responsive.allowHorizontalOverflow = true;
  assert.equal(evaluatePolicyMeasurements(overflowing, permissive).layoutPass, true);
});

test('transaction contract is a deep snapshot that ignores later source mutations', () => {
  const source = cloneConstraintContract(DEFAULT_CONSTRAINT_CONTRACT);
  const transaction = newTransaction('bundled_replay', source);
  source.accessibility.minimumContrast = 99;
  source.brand.protectedPrimaryRgb = 'rgb(0, 0, 0)';
  source.responsive.viewportWidth = 600;
  assert.deepEqual(transaction.contract, DEFAULT_CONSTRAINT_CONTRACT);
  assert.notEqual(transaction.contract.accessibility, source.accessibility);
  assert.notEqual(transaction.contract.brand, source.brand);
  assert.notEqual(transaction.contract.responsive, source.responsive);
});
