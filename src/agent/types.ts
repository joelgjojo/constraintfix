export type AgentPhase =
  | "idle"
  | "auditing"
  | "planning"
  | "patching"
  | "rendering"
  | "verifying"
  | "conflict"
  | "waiting_for_human"
  | "replanning"
  | "complete"
  | "failed";

export type ConstraintStatus = "pending" | "pass" | "fail";
export type RiskLevel = "low" | "medium" | "high";
export type AgentMode = "mock" | "live" | "replay";
export type DecisionSource = "mock" | "codex_live" | "codex_replay" | "demo_fallback";
export type RepairAction = "add_accessible_name" | "darken_cta" | "change_text_color" | "none";
export type RepairDecisionType = "apply_patch" | "request_human" | "replan" | "complete";

export interface AgentEvent {
  id: string;
  phase: AgentPhase;
  title: string;
  detail?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  timestamp: number;
}

export interface AccessibilityIssue {
  id: string;
  impact: string | null;
  help: string;
  nodes: number;
}

export interface VerificationResult {
  accessibilityPass: boolean;
  axeViolations: AccessibilityIssue[];
  contrastRatio: number;
  contrastPass: boolean;
  brandPass: boolean;
  layoutPass: boolean;
  brandColor: string;
}

/**
 * This is the only model-shaped object that crosses the server boundary. The
 * deterministic executor maps its `action` onto one of the four fixture
 * stages; it never evaluates model-produced code or CSS.
 */
export interface StructuredRepairCandidate {
  action: Extract<RepairAction, "darken_cta" | "change_text_color">;
  proposedChange: string;
  expectedEffect: string;
  risk: RiskLevel;
  confidence: number;
  rationale: string;
  constraints: string[];
}

export interface RepairDecision {
  type: RepairDecisionType;
  action: RepairAction;
  reason: string;
  risk: RiskLevel;
  source: DecisionSource;
  fallbackNotice?: string;
  candidate?: StructuredRepairCandidate;
  modelCalls?: number;
  usedThread?: boolean;
}

export interface AgentDecisionInput {
  phase: AgentPhase;
  stage: number;
  verification: VerificationResult | null;
  humanChoice?: "preserve_brand" | "allow_change";
  transactionId?: string;
}

export interface AgentProvider {
  readonly label: string;
  decide(input: AgentDecisionInput): Promise<RepairDecision>;
}
