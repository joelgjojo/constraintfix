import type { RepairAction, RiskLevel, StructuredRepairCandidate } from "@/agent/types";

const allowedActions = new Set<RepairAction>(["darken_cta", "change_text_color"]);
const allowedRisks = new Set<RiskLevel>(["low", "medium", "high"]);

export const codexCandidateSchema = {
  type: "object",
  additionalProperties: false,
  required: ["action", "proposedChange", "expectedEffect", "risk", "confidence", "rationale", "constraints"],
  properties: {
    action: { type: "string", enum: ["darken_cta", "change_text_color"] },
    proposedChange: { type: "string", minLength: 1, maxLength: 180 },
    expectedEffect: { type: "string", minLength: 1, maxLength: 180 },
    risk: { type: "string", enum: ["low", "medium", "high"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    rationale: { type: "string", minLength: 1, maxLength: 280 },
    constraints: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string", minLength: 1, maxLength: 80 },
    },
  },
} as const;

/**
 * OpenAI Structured Outputs accepts a deliberately smaller JSON Schema subset.
 * The browser still applies `isStructuredRepairCandidate` below, including all
 * length and numeric bounds, before a proposal can reach the executor.
 */
export const openaiCandidateSchema = {
  type: "object",
  additionalProperties: false,
  required: ["action", "proposedChange", "expectedEffect", "risk", "confidence", "rationale", "constraints"],
  properties: {
    action: { type: "string", enum: ["darken_cta", "change_text_color"] },
    proposedChange: { type: "string" },
    expectedEffect: { type: "string" },
    risk: { type: "string", enum: ["low", "medium", "high"] },
    confidence: { type: "number" },
    rationale: { type: "string" },
    constraints: { type: "array", items: { type: "string" } },
  },
} as const;

function isShortString(value: unknown, maximum: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

/** Runtime validation protects the browser and executor from malformed model output. */
export function isStructuredRepairCandidate(value: unknown): value is StructuredRepairCandidate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StructuredRepairCandidate>;
  return (
    allowedActions.has(candidate.action as RepairAction) &&
    isShortString(candidate.proposedChange, 180) &&
    isShortString(candidate.expectedEffect, 180) &&
    allowedRisks.has(candidate.risk as RiskLevel) &&
    typeof candidate.confidence === "number" &&
    Number.isFinite(candidate.confidence) &&
    candidate.confidence >= 0 &&
    candidate.confidence <= 1 &&
    isShortString(candidate.rationale, 280) &&
    Array.isArray(candidate.constraints) &&
    candidate.constraints.length > 0 &&
    candidate.constraints.length <= 4 &&
    candidate.constraints.every((constraint) => isShortString(constraint, 80))
  );
}
