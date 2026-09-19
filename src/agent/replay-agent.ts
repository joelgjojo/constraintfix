import type { AgentDecisionInput, AgentProvider, RepairDecision, StructuredRepairCandidate } from "@/agent/types";
import { isStructuredRepairCandidate } from "@/agent/candidate-schema";
import { mockAgent, preserveBrandCandidate, rejectionCandidate } from "@/agent/mock-agent";

const storageKey = "constraintfix:codex-replay-candidate";

function storedCandidate(): StructuredRepairCandidate | null {
  try {
    const stored = window.sessionStorage.getItem(storageKey);
    const candidate: unknown = stored ? JSON.parse(stored) : null;
    return isStructuredRepairCandidate(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

/** A live decision is captured only after it passes client validation; replay never makes a network call. */
export function captureLiveCandidate(candidate: StructuredRepairCandidate | undefined) {
  if (!candidate) return;
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(candidate));
  } catch {
    // Replay remains available with the verified fixture when session storage is unavailable.
  }
}

export const replayAgent: AgentProvider = {
  label: "CODEX REPLAY · verified response",
  async decide(input: AgentDecisionInput): Promise<RepairDecision> {
    const decision = await mockAgent.decide(input);
    const recorded = input.stage === 1 ? storedCandidate() : null;
    const candidate = recorded ?? decision.candidate ?? (input.humanChoice === "preserve_brand" ? preserveBrandCandidate : rejectionCandidate);
    const action = input.stage === 1 && candidate ? candidate.action : decision.action;

    return {
      ...decision,
      action,
      source: "codex_replay",
      candidate,
      reason: recorded
        ? `Replayed a validated Codex candidate: ${candidate.rationale}`
        : `Replayed the verified demo candidate: ${decision.reason}`,
    };
  },
};
