import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isStructuredRepairCandidate } from "../src/agent/candidate-schema";
import { __testables as clientTestables } from "../src/agent/codex-agent";
import { withDemoFallback } from "../src/agent/fallback-agent";
import { preserveBrandCandidate, rejectionCandidate } from "../src/agent/mock-agent";
import { resolveAgentMode } from "../src/agent/provider";
import { replayAgent } from "../src/agent/replay-agent";
import type { AgentProvider } from "../src/agent/types";
import { createOperationGate } from "../src/transactions/interaction";
import { aggregateVerification, files, sourceLabel, type FixtureVerification } from "../src/transactions/change-set";
import { __testables as serverTestables } from "../api/codex/decision.js";

const validMatrix = () => aggregateVerification(files.map((file): FixtureVerification => ({
  fixture: file.id, width: 375, scrollWidth: 375, semanticsPass: true,
  accessibilityPass: true, axeViolations: [], contrastPass: true, contrastRatio: 7.02,
  brandPass: true, brandColor: "rgb(96, 165, 250)", layoutPass: true,
})));

describe("structured repair candidates", () => {
  it("accepts only the constrained candidate schema", () => {
    assert.equal(isStructuredRepairCandidate(rejectionCandidate), true);
    assert.equal(isStructuredRepairCandidate({ ...rejectionCandidate, action: "inject_css" }), false);
    assert.equal(isStructuredRepairCandidate({ ...rejectionCandidate, confidence: 1.4 }), false);
    assert.equal(isStructuredRepairCandidate({ ...rejectionCandidate, constraints: [] }), false);
  });

  it("rejects an invalid server payload before it reaches the executor", () => {
    assert.equal(clientTestables.isServerDecision({ type: "apply_patch", action: "darken_cta", candidate: rejectionCandidate, modelCalls: 1, usedThread: false }), true);
    assert.equal(clientTestables.isServerDecision({ type: "apply_patch", action: "inject_css", candidate: rejectionCandidate, modelCalls: 1, usedThread: false }), false);
    assert.equal(clientTestables.isServerDecision({ type: "apply_patch", action: "change_text_color", candidate: rejectionCandidate, modelCalls: 1, usedThread: false }), false);
  });
});

describe("truthful offline fallback", () => {
  it("labels a failed optional live request as bundled replay", async () => {
    const unavailable: AgentProvider = { label: "Unavailable", decide: async () => { throw new Error("offline"); } };
    const fallback: AgentProvider = { label: "Bundled replay", decide: async () => ({ type: "apply_patch", action: "darken_cta", reason: "bundled", risk: "medium", source: "bundled_replay" }) };
    const decision = await withDemoFallback(unavailable, fallback).decide({ phase: "planning", stage: 1, verification: null, transactionId: "abcde-12345-fghij" });
    assert.equal(decision.source, "bundled_replay");
    assert.match(decision.fallbackNotice ?? "", /optional live connector/);
    assert.equal(sourceLabel(decision.source), "Bundled replay");
  });

  it("uses the bundled multi-file proposal with zero fetch calls", async () => {
    const previous = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; throw new Error("Replay must remain offline"); };
    try {
      const decision = await replayAgent.decide({ phase: "planning", stage: 1, verification: null, transactionId: "abcde-12345-fghij", changeSet: { request: "checkout", feedback: validMatrix() } });
      assert.equal(decision.source, "bundled_replay");
      assert.equal(decision.operations?.length, 3);
      assert.match(decision.reason, /Bundled audited proposal/);
      assert.equal(calls, 0);
    } finally { globalThis.fetch = previous; }
  });
});

describe("optional live connector guards", () => {
  it("accepts only supported planning turns", () => {
    assert.equal(serverTestables.isLiveInput({ transactionId: "12345678-abcd-efgh-ijkl-123456789abc", stage: 1, verification: null }), true);
    assert.equal(serverTestables.isLiveInput({ transactionId: "12345678-abcd-efgh-ijkl-123456789abc", stage: 2, verification: null, humanChoice: "preserve_brand" }), true);
    assert.equal(serverTestables.isLiveInput({ transactionId: "12345678-abcd-efgh-ijkl-123456789abc", stage: 2, verification: null, humanChoice: "allow_change" }), true);
    assert.equal(serverTestables.isLiveInput({ transactionId: "12345678-abcd-efgh-ijkl-123456789abc", stage: 2, verification: null }), false);
  });

  it("requires the policy-specific structured action", () => {
    assert.equal(serverTestables.isAllowedCandidate(rejectionCandidate, 1), true);
    assert.equal(serverTestables.isAllowedCandidate(rejectionCandidate, 2), false);
    assert.equal(serverTestables.isAllowedCandidate(preserveBrandCandidate, 2, "preserve_brand"), true);
    assert.equal(serverTestables.isAllowedCandidate(rejectionCandidate, 2, "allow_change"), true);
  });
});

describe("interaction integrity", () => {
  it("locks duplicate operations until the current interaction completes", () => {
    const gate = createOperationGate();
    assert.equal(gate.tryAcquire(), true);
    assert.equal(gate.tryAcquire(), false);
    assert.equal(gate.isLocked(), true);
    gate.release();
    assert.equal(gate.isLocked(), false);
  });

  it("defaults unknown mode values to mock and never to live", () => {
    assert.equal(resolveAgentMode(), "mock");
    assert.equal(resolveAgentMode("unexpected"), "mock");
    assert.equal(resolveAgentMode("REPLAY"), "replay");
    assert.equal(resolveAgentMode("live"), "live");
  });
});
