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
export type DecisionSource = "mock" | "openai" | "demo_fallback";

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

export interface RepairDecision {
  type: "apply_patch" | "request_human" | "replan" | "complete";
  action: "add_accessible_name" | "darken_cta" | "change_text_color" | "none";
  reason: string;
  risk: RiskLevel;
  source: DecisionSource;
  fallbackNotice?: string;
}

export interface AgentDecisionInput {
  phase: AgentPhase;
  stage: number;
  verification: VerificationResult | null;
  humanChoice?: "preserve_brand" | "allow_change";
}

export interface AgentProvider {
  readonly label: string;
  decide(input: AgentDecisionInput): Promise<RepairDecision>;
}
