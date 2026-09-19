import type { AgentProvider, RepairDecision, StructuredRepairCandidate } from "@/agent/types";

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const rejectionCandidate: StructuredRepairCandidate = {
  action: "darken_cta",
  proposedChange: "Change the CTA background from #60A5FA to #2563EB.",
  expectedEffect: "White CTA text reaches WCAG AA contrast while DOM geometry stays stable.",
  risk: "medium",
  confidence: 0.91,
  rationale: "The contrast audit fails on white text over the protected blue background.",
  constraints: ["WCAG AA contrast", "375px no-overflow", "protected token review"],
};

export const preserveBrandCandidate: StructuredRepairCandidate = {
  action: "change_text_color",
  proposedChange: "Keep #60A5FA and change CTA text from #FFFFFF to #0F172A.",
  expectedEffect: "Contrast passes without changing the protected brand token or layout.",
  risk: "low",
  confidence: 0.98,
  rationale: "The protected surface must remain exact; a foreground change resolves the conflict safely.",
  constraints: ["WCAG AA contrast", "#60A5FA token equality", "375px no-overflow"],
};

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
        candidate: preserveBrandCandidate,
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
        candidate: rejectionCandidate,
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
