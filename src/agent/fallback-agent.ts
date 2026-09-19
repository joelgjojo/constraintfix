import type { AgentDecisionInput, AgentProvider, RepairDecision } from "@/agent/types";

/** Keeps an explicitly requested live demo moving if the optional connector cannot return a valid candidate. */
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
          fallbackNotice: "The optional live connector was unavailable or returned an invalid candidate, so ConstraintFix continued with its bundled audited proposal.",
        };
      }
    },
  };
}
