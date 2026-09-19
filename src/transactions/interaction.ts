import type { AgentEvent, AgentPhase, VerificationResult } from "@/agent/types";
import type { ConstraintReceipt, RepairTransaction } from "@/transactions/types";

/** A synchronous gate prevents a second UI event from starting the same run. */
export function createOperationGate() {
  let locked = false;

  return {
    tryAcquire() {
      if (locked) return false;
      locked = true;
      return true;
    },
    release() {
      locked = false;
    },
    isLocked() {
      return locked;
    },
  };
}

/** The complete local state restored by Reset demo and Restart demo. */
export function createIdleDemoState() {
  return {
    stage: 0,
    phase: "idle" as AgentPhase,
    events: [] as AgentEvent[],
    verification: null as VerificationResult | null,
    transaction: null as RepairTransaction | null,
    receipt: null as ConstraintReceipt | null,
    running: false,
    brandOverride: false,
  };
}
