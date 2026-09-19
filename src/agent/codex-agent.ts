import { isStructuredRepairCandidate } from "@/agent/candidate-schema";
import { captureLiveCandidate } from "@/agent/replay-agent";
import type { AgentDecisionInput, AgentProvider, RepairDecision, StructuredRepairCandidate } from "@/agent/types";

interface ServerDecision {
  type: "apply_patch" | "replan";
  action: "darken_cta" | "change_text_color";
  candidate: StructuredRepairCandidate;
  modelCalls: number;
  usedThread: boolean;
}

function isServerDecision(value: unknown): value is ServerDecision {
  if (!value || typeof value !== "object") return false;
  const decision = value as Partial<ServerDecision>;
  return (
    (decision.type === "apply_patch" || decision.type === "replan") &&
    (decision.action === "darken_cta" || decision.action === "change_text_color") &&
    isStructuredRepairCandidate(decision.candidate) &&
    decision.action === decision.candidate.action &&
    typeof decision.modelCalls === "number" &&
    decision.modelCalls >= 1 &&
    decision.modelCalls <= 2 &&
    decision.usedThread === true
  );
}

export const __testables = { isServerDecision };

export const codexAgent: AgentProvider = {
  label: "CODEX LIVE · structured candidate",
  async decide(input: AgentDecisionInput): Promise<RepairDecision> {
    if (!input.transactionId || (input.stage !== 1 && input.humanChoice !== "preserve_brand")) {
      throw new Error("Live Codex decisions require a repair transaction and a supported planning stage.");
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch("/api/codex/decision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Codex decision endpoint returned ${response.status}.`);
      const decision: unknown = await response.json();
      if (!isServerDecision(decision)) throw new Error("Codex returned an invalid structured repair candidate.");

      const candidate = decision.candidate;
      captureLiveCandidate(candidate);
      return {
        ...decision,
        source: "codex_live",
        reason: candidate.rationale,
        risk: candidate.risk,
      };
    } finally {
      window.clearTimeout(timeout);
    }
  },
};
