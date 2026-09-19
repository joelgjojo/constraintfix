import { Check, ShieldCheck, TriangleAlert, Waves } from "lucide-react";
import type { VerificationResult } from "@/agent/types";
import { cn } from "@/lib/utils";

interface ConstraintPanelProps {
  result: VerificationResult | null;
  brandOverride?: boolean;
}

function Status({ state, text }: { state: "pass" | "fail" | "pending" | "warn"; text: string }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.08em]",
        state === "pass" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        state === "fail" && "border-rose-400/20 bg-rose-400/10 text-rose-300",
        state === "warn" && "border-amber-400/20 bg-amber-400/10 text-amber-300",
        state === "pending" && "border-white/10 bg-white/[0.03] text-zinc-600",
      )}
    >
      {text}
    </span>
  );
}

export function ConstraintPanel({ result, brandOverride = false }: ConstraintPanelProps) {
  const accessibilityState = !result ? "pending" : result.accessibilityPass ? "pass" : "fail";
  const brandState = !result ? "pending" : brandOverride ? "warn" : result.brandPass ? "pass" : "fail";
  const layoutState = !result ? "pending" : result.layoutPass ? "pass" : "fail";

  return (
    <section className="panel p-5">
      <div className="section-kicker">DETERMINISTIC VERIFICATION</div>
      <div className="mt-1 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Constraint contract</h2>
          <p className="mt-1 text-[11px] text-zinc-600">The model cannot mark its own work as successful.</p>
        </div>
        <ShieldCheck size={17} className="text-zinc-600" />
      </div>

      <div className="mt-5 divide-y divide-white/[0.06]">
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-start gap-3">
            <span className="constraint-icon"><Check size={14} /></span>
            <div>
              <div className="text-xs font-medium text-zinc-200">Accessibility</div>
              <div className="mt-1 text-[11px] text-zinc-600">
                axe-core + WCAG AA contrast ≥ 4.5:1
                {result && <span className="ml-2 text-zinc-500">({result.contrastRatio.toFixed(2)}:1)</span>}
              </div>
            </div>
          </div>
          <Status state={accessibilityState} text={!result ? "WAITING" : result.accessibilityPass ? "PASS" : `${result.axeViolations.length || 1} ISSUE`} />
        </div>

        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-start gap-3">
            <span className="constraint-icon"><Waves size={14} /></span>
            <div>
              <div className="text-xs font-medium text-zinc-200">Protected brand token</div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-600">
                <span className="h-2.5 w-2.5 rounded-full bg-[#60A5FA] ring-1 ring-white/10" /> #60A5FA must remain unchanged
              </div>
            </div>
          </div>
          <Status state={brandState} text={!result ? "WAITING" : brandOverride ? "OVERRIDDEN" : result.brandPass ? "PASS" : "FAIL"} />
        </div>

        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-start gap-3">
            <span className="constraint-icon"><TriangleAlert size={14} /></span>
            <div>
              <div className="text-xs font-medium text-zinc-200">Responsive layout</div>
              <div className="mt-1 text-[11px] text-zinc-600">No horizontal overflow at the 375px demo viewport</div>
            </div>
          </div>
          <Status state={layoutState} text={!result ? "WAITING" : result.layoutPass ? "PASS" : "FAIL"} />
        </div>
      </div>
    </section>
  );
}
