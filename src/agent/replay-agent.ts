import type { AgentDecisionInput, AgentProvider, RepairDecision } from "@/agent/types";
import { mockAgent } from "@/agent/mock-agent";

export const replayAgent: AgentProvider = {
  label: "BUNDLED REPLAY · offline",
  async decide(input: AgentDecisionInput): Promise<RepairDecision> {
    const decision = await mockAgent.decide(input);
    return {
      ...decision,
      source: "bundled_replay",
      reason: `Bundled audited proposal: ${decision.reason}`,
    };
  },
};
