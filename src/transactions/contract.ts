import type { DecisionSource, VerificationResult } from "@/agent/types";
import type {
  CandidateId,
  ConstraintContract,
  ConstraintReceipt,
  RepairCandidate,
  RepairTransaction,
  TransactionStatus,
  VerificationSnapshot,
} from "@/transactions/types";

export const constraintContract: ConstraintContract = {
  id: "CF-CONTRACT-01",
  accessibility: {
    standard: "WCAG AA",
    maximumViolations: 0,
    minimumContrastRatio: 4.5,
  },
  brand: {
    protectedToken: "#60A5FA",
    tokenName: "--brand-primary",
  },
  responsive: {
    viewport: 375,
    noHorizontalOverflow: true,
  },
  autonomy: {
    lowRisk: "auto",
    protectedConstraintChange: "ask",
    ambiguousTradeoff: "ask",
  },
};

export function toVerificationSnapshot(result: VerificationResult): VerificationSnapshot {
  return {
    accessibility: {
      pass: result.accessibilityPass,
      violations: result.axeViolations.length,
      contrastRatio: result.contrastRatio,
    },
    brand: {
      pass: result.brandPass,
      expected: constraintContract.brand.protectedToken,
      actual: result.brandColor,
    },
    layout: {
      pass: result.layoutPass,
      viewport: constraintContract.responsive.viewport,
      overflowDetected: !result.layoutPass,
    },
    overallPass: result.accessibilityPass && result.brandPass && result.layoutPass,
  };
}

function candidate(id: CandidateId, source: DecisionSource): RepairCandidate {
  if (id === "candidate-a") {
    return {
      id,
      label: "Candidate A · darken CTA",
      action: "#60A5FA → #2563EB",
      source,
      status: "pending",
      violatedConstraints: [],
    };
  }

  return {
    id,
    label: "Candidate B · preserve brand",
    action: "Keep #60A5FA · set text #0F172A",
    source,
    status: "pending",
    violatedConstraints: [],
  };
}

export function createRepairTransaction(initialVerification: VerificationSnapshot, source: DecisionSource): RepairTransaction {
  return {
    id: "CF-018",
    transactionId: crypto.randomUUID(),
    component: "PricingCard.tsx",
    source,
    status: "running",
    startedAt: new Date().toISOString(),
    initialVerification,
    candidates: [candidate("candidate-a", source), candidate("candidate-b", source)],
    rollbackCount: 0,
    humanIntervention: { required: false },
  };
}

export function updateCandidate(
  transaction: RepairTransaction,
  candidateId: CandidateId,
  changes: Partial<RepairCandidate>,
): RepairTransaction {
  return {
    ...transaction,
    candidates: transaction.candidates.map((item) => (item.id === candidateId ? { ...item, ...changes } : item)),
  };
}

export function updateTransaction(
  transaction: RepairTransaction,
  status: TransactionStatus,
  changes: Partial<Omit<RepairTransaction, "id" | "source" | "status" | "candidates" | "initialVerification">> = {},
): RepairTransaction {
  return { ...transaction, ...changes, status };
}

export function createConstraintReceipt(transaction: RepairTransaction): ConstraintReceipt | null {
  if (!transaction.finalVerification) return null;

  const originalViolations = [
    `${transaction.initialVerification.accessibility.violations} accessibility violation${transaction.initialVerification.accessibility.violations === 1 ? "" : "s"}`,
    `CTA contrast ${transaction.initialVerification.accessibility.contrastRatio.toFixed(2)}:1`,
  ];

  return {
    receiptId: transaction.id,
    runId: transaction.id,
    transactionId: transaction.transactionId,
    component: transaction.component,
    generatedAt: new Date().toISOString(),
    source: transaction.source,
    contract: constraintContract,
    originalViolations,
    candidateHistory: transaction.candidates,
    finalVerification: transaction.finalVerification,
    transactionStatus: transaction.status,
    rollbackCount: transaction.rollbackCount,
    humanIntervention: transaction.humanIntervention,
  };
}
