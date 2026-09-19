import { Check, Circle, RotateCcw, ShieldAlert, X } from "lucide-react";
import type { RepairCandidate } from "@/transactions/types";
import { cn } from "@/lib/utils";

interface CandidateComparisonProps {
  candidates: RepairCandidate[];
}

function Result({ pass, pending = false }: { pass?: boolean; pending?: boolean }) {
  if (pending) return <span className="text-zinc-600">—</span>;
  return pass ? <Check size={12} className="text-emerald-300" aria-label="Pass" /> : <X size={12} className="text-rose-300" aria-label="Fail" />;
}

export function CandidateComparison({ candidates }: CandidateComparisonProps) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/15 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[9px] font-bold tracking-[0.13em] text-zinc-500">CANDIDATE COMPARISON</span>
        <span className="text-[9px] text-zinc-600">deterministic results</span>
      </div>
      <div className="space-y-2">
        {candidates.map((candidate) => {
          const snapshot = candidate.verification;
          const pending = !snapshot;
          const rejected = candidate.status === "rejected";
          const approvedException = candidate.status === "approved_exception";

          return (
            <div key={candidate.id} className={cn("rounded-lg border px-3 py-2.5", rejected ? "border-rose-400/15 bg-rose-400/[0.035]" : candidate.status === "accepted" ? "border-emerald-400/15 bg-emerald-400/[0.035]" : "border-white/[0.06] bg-white/[0.015]")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold text-zinc-200">{candidate.label}</div>
                  <div className="mt-0.5 text-[10px] text-zinc-600">{candidate.action} · {candidate.source.replaceAll("_", " ")}</div>
                </div>
                <span className={cn("inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.08em]", rejected ? "text-rose-300" : candidate.status === "accepted" ? "text-emerald-300" : approvedException ? "text-amber-300" : "text-zinc-600")}>
                  {rejected ? <ShieldAlert size={11} /> : candidate.status === "accepted" ? <Check size={11} /> : approvedException ? <Circle size={10} /> : null}
                  {candidate.status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-2 text-[9px] text-zinc-500">
                <span className="flex items-center gap-1"><Result pass={snapshot?.accessibility.pass} pending={pending} /> a11y</span>
                <span className="flex items-center gap-1"><Result pass={snapshot?.brand.pass} pending={pending} /> brand</span>
                <span className="flex items-center gap-1"><Result pass={snapshot?.layout.pass} pending={pending} /> 375px</span>
              </div>
              {candidate.rollbackApplied && <div className="mt-2 flex items-center gap-1 text-[9px] text-zinc-500"><RotateCcw size={10} /> state rolled back automatically</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
