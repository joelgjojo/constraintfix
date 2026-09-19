import type { AgentProvider, RepairDecision } from "@/agent/types";

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const mockAgent: AgentProvider = {
  label: "Mock decision layer",
  async decide({ stage, verification, humanChoice }): Promise<RepairDecision> {
    await sleep(520);

    if (humanChoice === "preserve_brand") {
      return {
        type: "replan",
        action: "change_text_color",
        risk: "low",
        source: "mock",
        reason:
          "The protected background token must remain unchanged, so preserve the brand surface and improve contrast by changing the CTA foreground instead.",
      };
    }

    if (humanChoice === "allow_change") {
      return {
        type: "complete",
        action: "none",
        risk: "high",
        source: "mock",
        reason: "The developer explicitly accepted the protected-token change.",
      };
    }

    if (stage === 0 && verification) {
      return {
        type: "apply_patch",
        action: "add_accessible_name",
        risk: "low",
        source: "mock",
        reason:
          "The icon button has no accessible name. This is a low-risk semantic repair that does not affect layout or brand styling.",
      };
    }

    if (stage === 1 && verification) {
      return {
        type: "apply_patch",
        action: "darken_cta",
        risk: "medium",
        source: "mock",
        reason:
          "The CTA still fails contrast. Darkening the CTA background should satisfy WCAG contrast, but the result must be verified against protected design constraints.",
      };
    }

    if (stage === 2 && verification && verification.accessibilityPass && !verification.brandPass) {
      return {
        type: "request_human",
        action: "none",
        risk: "high",
        source: "mock",
        reason:
          "The accessibility repair succeeds but modifies a protected brand token. This trade-off requires product judgment rather than autonomous execution.",
      };
    }

    if (stage === 3 && verification?.accessibilityPass && verification.brandPass && verification.layoutPass) {
      return {
        type: "complete",
        action: "none",
        risk: "low",
        source: "mock",
        reason: "All deterministic constraints pass.",
      };
    }

    return {
      type: "replan",
      action: "none",
      risk: "medium",
      source: "mock",
      reason: "The current state does not satisfy all constraints. Re-evaluate the repair strategy.",
    };
  },
};
