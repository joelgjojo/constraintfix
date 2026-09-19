import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { isStructuredRepairCandidate } from "../src/agent/candidate-schema";
import { __testables as clientTestables } from "../src/agent/codex-agent";
import { withDemoFallback } from "../src/agent/fallback-agent";
import { preserveBrandCandidate, rejectionCandidate } from "../src/agent/mock-agent";
import { captureLiveCandidate, replayAgent } from "../src/agent/replay-agent";
import type { AgentProvider } from "../src/agent/types";
import { __testables as serverTestables } from "../server/codex-proxy";

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
  serverTestables.sessions.clear();
});

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
      usedThread: true,
    }), true);
    assert.equal(clientTestables.isServerDecision({
      type: "apply_patch",
      action: "inject_css",
      candidate: rejectionCandidate,
      modelCalls: 1,
      usedThread: true,
    }), false);
    assert.equal(clientTestables.isServerDecision({
      type: "apply_patch",
      action: "change_text_color",
      candidate: rejectionCandidate,
      modelCalls: 1,
      usedThread: true,
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
    assert.match(decision.fallbackNotice ?? "", /Codex Live/);
  });

  it("replays a captured valid Codex candidate without a network call", async () => {
    captureLiveCandidate(preserveBrandCandidate);
    const decision = await replayAgent.decide({ phase: "planning", stage: 1, verification: null, transactionId: "abcde-12345-fghij" });
    assert.equal(decision.source, "codex_replay");
    assert.equal(decision.action, "change_text_color");
    assert.match(decision.reason, /validated Codex candidate/);
  });
});

describe("server live-thread guard", () => {
  it("accepts only the initial turn or the same-thread preserve-brand replan", () => {
    assert.equal(serverTestables.isLiveInput({ transactionId: "12345678-abcd-efgh-ijkl-123456789abc", stage: 1, verification: null }), true);
    assert.equal(serverTestables.isLiveInput({ transactionId: "12345678-abcd-efgh-ijkl-123456789abc", stage: 2, verification: null, humanChoice: "preserve_brand" }), true);
    assert.equal(serverTestables.isLiveInput({ transactionId: "12345678-abcd-efgh-ijkl-123456789abc", stage: 2, verification: null }), false);
  });

  it("prunes expired thread sessions so a replay fallback cannot accidentally reuse one", () => {
    serverTestables.sessions.set("expired-thread-session", { thread: {} as never, calls: 1, expiresAt: 10 });
    serverTestables.pruneSessions(11);
    assert.equal(serverTestables.sessions.size, 0);
  });
});
