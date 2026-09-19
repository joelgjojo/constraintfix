import { validOperations } from "@/transactions/change-set";
import { isStructuredRepairCandidate } from "@/agent/candidate-schema";
import type { AgentDecisionInput, AgentProvider, RepairDecision, StructuredRepairCandidate } from "@/agent/types";

interface ServerDecision {
  type: "apply_patch" | "replan";
  action: "darken_cta" | "change_text_color";
  candidate: StructuredRepairCandidate;
  modelCalls: number;
  usedThread: boolean;
  operations?: import("@/transactions/change-set").Operation[];
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
    typeof decision.usedThread === "boolean"
  );
}

export const __testables = { isServerDecision };

export const codexAgent: AgentProvider = {
  label: "OPTIONAL OPENAI LIVE CONNECTOR",
  async decide(input: AgentDecisionInput): Promise<RepairDecision> {
    if (!input.transactionId || (input.stage !== 1 && input.humanChoice !== "preserve_brand" && input.humanChoice !== "allow_change")) {
      throw new Error("Live OpenAI decisions require a repair transaction and a supported planning stage.");
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
      if (!response.ok) throw new Error(`OpenAI decision endpoint returned ${response.status}.`);
      const decision: unknown = await response.json();
      if (!isServerDecision(decision)) throw new Error("OpenAI returned an invalid structured repair candidate.");

      if (input.changeSet && !validOperations(decision.operations, input.humanChoice)) throw new Error("Invalid multi-file operations from live planner.");
      const candidate = decision.candidate;
      return {
        ...decision,
        source: "openai_live",
        reason: candidate.rationale,
        risk: candidate.risk,
      };
    } finally {
      window.clearTimeout(timeout);
    }
  },
};
