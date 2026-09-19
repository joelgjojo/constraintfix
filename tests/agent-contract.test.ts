import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { isStructuredRepairCandidate } from "../src/agent/candidate-schema";
import { __testables as clientTestables } from "../src/agent/codex-agent";
import { withDemoFallback } from "../src/agent/fallback-agent";
import { preserveBrandCandidate, rejectionCandidate } from "../src/agent/mock-agent";
import { resolveAgentMode } from "../src/agent/provider";
import { captureLiveCandidate, replayAgent } from "../src/agent/replay-agent";
import type { AgentProvider } from "../src/agent/types";
import { createConstraintReceipt, createRepairTransaction, serializeConstraintReceipt, updateCandidate, updateTransaction } from "../src/transactions/contract";
import { createIdleDemoState, createOperationGate } from "../src/transactions/interaction";
import type { VerificationSnapshot } from "../src/transactions/types";
import { __testables as serverTestables } from "../api/codex/decision";

function installBrowserStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      setTimeout,
      clearTimeout,
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    },
  });
}

beforeEach(() => {
  installBrowserStorage();
});

const initialVerification: VerificationSnapshot = {
  accessibility: { pass: false, violations: 1, contrastRatio: 2.54 },
  brand: { pass: true, expected: "#60A5FA", actual: "rgb(96, 165, 250)" },
  layout: { pass: true, viewport: 375, overflowDetected: false },
  overallPass: false,
};

const verifiedRepair: VerificationSnapshot = {
  accessibility: { pass: true, violations: 0, contrastRatio: 7.02 },
  brand: { pass: true, expected: "#60A5FA", actual: "rgb(96, 165, 250)" },
  layout: { pass: true, viewport: 375, overflowDetected: false },
  overallPass: true,
};

const approvedException: VerificationSnapshot = {
  ...verifiedRepair,
  brand: { pass: false, expected: "#60A5FA", actual: "rgb(37, 99, 235)" },
  overallPass: false,
};

describe("structured repair candidates", () => {
  it("accepts only the constrained candidate schema", () => {
    assert.equal(isStructuredRepairCandidate(rejectionCandidate), true);
    assert.equal(isStructuredRepairCandidate({ ...rejectionCandidate, action: "inject_css" }), false);
    assert.equal(isStructuredRepairCandidate({ ...rejectionCandidate, confidence: 1.4 }), false);
    assert.equal(isStructuredRepairCandidate({ ...rejectionCandidate, constraints: [] }), false);
  });

  it("rejects an invalid server payload before it reaches the executor", () => {
    assert.equal(clientTestables.isServerDecision({
      type: "apply_patch",
      action: "darken_cta",
      candidate: rejectionCandidate,
      modelCalls: 1,
      usedThread: false,
    }), true);
    assert.equal(clientTestables.isServerDecision({
      type: "apply_patch",
      action: "inject_css",
      candidate: rejectionCandidate,
      modelCalls: 1,
      usedThread: false,
    }), false);
    assert.equal(clientTestables.isServerDecision({
      type: "apply_patch",
      action: "change_text_color",
      candidate: rejectionCandidate,
      modelCalls: 1,
      usedThread: false,
    }), false);
  });
});

describe("fallback and replay", () => {
  it("keeps the replay source visible when live planning fails", async () => {
    const unavailable: AgentProvider = {
      label: "Unavailable",
      decide: async () => { throw new Error("offline"); },
    };
    const fallback: AgentProvider = {
      label: "Replay",
      decide: async () => ({ type: "apply_patch", action: "darken_cta", reason: "replayed", risk: "medium", source: "codex_replay" }),
    };
    const decision = await withDemoFallback(unavailable, fallback).decide({ phase: "planning", stage: 1, verification: null, transactionId: "abcde-12345-fghij" });
    assert.equal(decision.source, "codex_replay");
    assert.match(decision.fallbackNotice ?? "", /OpenAI Live/);
  });

  it("replays a captured valid OpenAI candidate without a network call", async () => {
    captureLiveCandidate(preserveBrandCandidate);
    const decision = await replayAgent.decide({ phase: "planning", stage: 1, verification: null, transactionId: "abcde-12345-fghij" });
    assert.equal(decision.source, "codex_replay");
    assert.equal(decision.action, "change_text_color");
    assert.match(decision.reason, /validated OpenAI candidate/);
  });
});

describe("server live-input guard", () => {
  it("accepts only the initial turn or a preserve-brand replan", () => {
    assert.equal(serverTestables.isLiveInput({ transactionId: "12345678-abcd-efgh-ijkl-123456789abc", stage: 1, verification: null }), true);
    assert.equal(serverTestables.isLiveInput({ transactionId: "12345678-abcd-efgh-ijkl-123456789abc", stage: 2, verification: null, humanChoice: "preserve_brand" }), true);
    assert.equal(serverTestables.isLiveInput({ transactionId: "12345678-abcd-efgh-ijkl-123456789abc", stage: 2, verification: null }), false);
  });

  it("requires the stage-specific action from a structured live candidate", () => {
    assert.equal(serverTestables.isAllowedCandidate(rejectionCandidate, 1), true);
    assert.equal(serverTestables.isAllowedCandidate(rejectionCandidate, 2), false);
    assert.equal(serverTestables.isAllowedCandidate(preserveBrandCandidate, 2), true);
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
    assert.equal(gate.tryAcquire(), true);
  });

  it("returns every demo field to the exact idle state", () => {
    assert.deepEqual(createIdleDemoState(), {
      stage: 0,
      phase: "idle",
      events: [],
      verification: null,
      transaction: null,
      receipt: null,
      running: false,
      brandOverride: false,
    });
  });

  it("keeps Preserve Brand as a fully verified 3/3 receipt", () => {
    const started = createRepairTransaction(initialVerification, "mock");
    const completed = updateTransaction(
      updateCandidate(started, "candidate-b", { status: "accepted", verification: verifiedRepair, violatedConstraints: [] }),
      "accepted",
      {
        completedAt: "2026-09-20T00:00:01.000Z",
        finalVerification: verifiedRepair,
        humanIntervention: { required: true, choice: "preserve_brand" },
      },
    );
    const receipt = createConstraintReceipt(completed);
    assert.ok(receipt);
    assert.equal(receipt.transactionStatus, "accepted");
    assert.equal(receipt.finalVerification.overallPass, true);
    assert.equal(receipt.evaluation.finalConstraints, "3/3");
  });

  it("records Allow Change as an approved exception without falsifying brand verification", () => {
    const started = createRepairTransaction(initialVerification, "mock");
    const completed = updateTransaction(
      updateCandidate(started, "candidate-a", {
        status: "approved_exception",
        verification: approvedException,
        rollbackApplied: true,
        violatedConstraints: ["Protected token --brand-primary (#60A5FA), human-approved"],
      }),
      "approved_exception",
      {
        completedAt: "2026-09-20T00:00:01.000Z",
        finalVerification: approvedException,
        rollbackCount: 1,
        humanIntervention: { required: true, choice: "allow_change" },
      },
    );
    const receipt = createConstraintReceipt(completed);
    assert.ok(receipt);
    assert.equal(receipt.transactionStatus, "approved_exception");
    assert.equal(receipt.humanIntervention.choice, "allow_change");
    assert.equal(receipt.finalVerification.brand.pass, false);
    assert.equal(receipt.finalVerification.overallPass, false);
    assert.equal(receipt.evaluation.finalConstraints, "2/3");
    assert.equal(receipt.evaluation.rejectedCandidates, 1);
    const exported = JSON.parse(serializeConstraintReceipt(receipt));
    assert.equal(exported.transactionId, receipt.transactionId);
    assert.equal(exported.transactionStatus, "approved_exception");
  });

  it("defaults unknown or absent mode values to mock, never live", () => {
    assert.equal(resolveAgentMode(), "mock");
    assert.equal(resolveAgentMode("unexpected"), "mock");
    assert.equal(resolveAgentMode("REPLAY"), "replay");
    assert.equal(resolveAgentMode("live"), "live");
  });
});
