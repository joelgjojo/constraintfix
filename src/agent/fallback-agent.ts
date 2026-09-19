import type { AgentDecisionInput, AgentProvider, RepairDecision } from "@/agent/types";

/** Keeps a live demo moving if the optional decision service is unavailable. */
export function withDemoFallback(primary: AgentProvider, fallback: AgentProvider): AgentProvider {
  return {
    label: `${primary.label} with demo fallback`,
    async decide(input: AgentDecisionInput): Promise<RepairDecision> {
      try {
        return await primary.decide(input);
      } catch {
        const decision = await fallback.decide(input);
        return {
          ...decision,
          source: "demo_fallback",
          fallbackNotice: "OpenAI was unavailable, so ConstraintFix continued with its deterministic demo reasoner.",
        };
      }
    },
  };
}
