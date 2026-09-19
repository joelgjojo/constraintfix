import type { DecisionSource, VerificationResult } from "@/agent/types";

export type CandidateId = "candidate-a" | "candidate-b";
export type CandidateStatus = "pending" | "running" | "rejected" | "accepted" | "approved_exception";
export type TransactionStatus =
  | "running"
  | "rejected"
  | "rolled_back"
  | "waiting_for_human"
  | "accepted"
  | "approved_exception"
  | "failed";

export interface ConstraintContract {
  id: "CF-CONTRACT-01";
  accessibility: {
    standard: "WCAG AA";
    maximumViolations: 0;
    minimumContrastRatio: 4.5;
  };
  brand: {
    protectedToken: "#60A5FA";
    tokenName: "--brand-primary";
  };
  responsive: {
    viewport: 375;
    noHorizontalOverflow: true;
  };
  autonomy: {
    lowRisk: "auto";
    protectedConstraintChange: "ask";
    ambiguousTradeoff: "ask";
  };
}

export interface VerificationSnapshot {
  accessibility: {
    pass: boolean;
    violations: number;
    contrastRatio: number;
  };
  brand: {
    pass: boolean;
    expected: "#60A5FA";
    actual: string;
  };
  layout: {
    pass: boolean;
    viewport: 375;
    overflowDetected: boolean;
  };
  overallPass: boolean;
}

export interface RepairCandidate {
  id: CandidateId;
  label: string;
  action: string;
  source: DecisionSource;
  status: CandidateStatus;
  verification?: VerificationSnapshot;
  violatedConstraints: string[];
  rollbackApplied?: boolean;
  note?: string;
}

export interface HumanIntervention {
  required: boolean;
  choice?: "preserve_brand" | "allow_change";
  reason?: string;
}

export interface RepairTransaction {
  id: "CF-018";
  transactionId: string;
  component: "PricingCard.tsx";
  source: DecisionSource;
  status: TransactionStatus;
  startedAt: string;
  completedAt?: string;
  initialVerification: VerificationSnapshot;
  candidates: RepairCandidate[];
  rollbackCount: number;
  humanIntervention: HumanIntervention;
  finalVerification?: VerificationSnapshot;
}

export interface ConstraintReceipt {
  receiptId: "CF-018";
  runId: "CF-018";
  transactionId: string;
  component: "PricingCard.tsx";
  generatedAt: string;
  source: DecisionSource;
  contract: ConstraintContract;
  originalViolations: string[];
  candidateHistory: RepairCandidate[];
  finalVerification: VerificationSnapshot;
  transactionStatus: TransactionStatus;
  rollbackCount: number;
  humanIntervention: HumanIntervention;
}

export type { VerificationResult };
