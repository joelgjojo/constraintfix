import type { AgentDecisionInput, AgentProvider, RepairDecision } from "@/agent/types";

type ServerDecision = Omit<RepairDecision, "source" | "fallbackNotice">;

const validTypes = new Set<ServerDecision["type"]>([
  "apply_patch",
  "request_human",
  "replan",
  "complete",
]);

const validActions = new Set<ServerDecision["action"]>([
  "add_accessible_name",
  "darken_cta",
  "change_text_color",
  "none",
]);

const validRisks = new Set<ServerDecision["risk"]>(["low", "medium", "high"]);

function isServerDecision(value: unknown): value is ServerDecision {
  if (!value || typeof value !== "object") return false;
  const decision = value as Partial<ServerDecision>;
  return (
    typeof decision.reason === "string" &&
    validTypes.has(decision.type as ServerDecision["type"]) &&
    validActions.has(decision.action as ServerDecision["action"]) &&
    validRisks.has(decision.risk as ServerDecision["risk"])
  );
}

export const openAIAgent: AgentProvider = {
  label: "OpenAI decision layer",
  async decide(input: AgentDecisionInput): Promise<RepairDecision> {
    const controller = new AbortController();
    // A structured reasoning response can take longer than an ordinary UI fetch.
    // The fallback remains available after a bounded wait.
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch("/api/agent/decision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Decision endpoint returned ${response.status}.`);
      }

      const decision: unknown = await response.json();
      if (!isServerDecision(decision)) {
        throw new Error("Decision endpoint returned an invalid structured decision.");
      }

      return { ...decision, source: "openai" };
    } finally {
      window.clearTimeout(timeout);
    }
  },
};
