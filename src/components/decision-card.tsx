import { ArrowRight, GitBranch, RotateCcw, ShieldAlert, Sparkles } from "lucide-react";
import { BorderGlow } from "@/components/ui/border-glow";
import { GradientButton } from "@/components/ui/gradient-button";
import type { ConstraintContract } from "@/constraints/contract";

interface DecisionCardProps {
  onPreserveBrand: () => void;
  onAllowChange: () => void;
  onReset: () => void;
  disabled?: boolean;
  multiFile?: boolean;
  contract: ConstraintContract;
}

export function DecisionCard({ onPreserveBrand, onAllowChange, onReset, contract, disabled = false, multiFile = false }: DecisionCardProps) {
  return (
    <BorderGlow className="decision-glow self-start" glowColor="96, 165, 250" animated>
    <section className="panel relative overflow-hidden border-0 bg-[#0b0e12] p-5">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-amber-300/[0.04] blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-amber-300">
          <ShieldAlert size={13} /> CONSTRAINT CONFLICT · HUMAN DECISION REQUIRED
        </div>
        <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">{multiFile ? "Three-file change set rejected. One policy decision." : "Candidate A passed WCAG, then failed the contract."}</h2>
        <p className="mt-2 max-w-xl text-xs leading-5 text-zinc-500">
          {multiFile ? "Header overflow and the detached form label must be repaired either way. The pricing candidate remains readable but changed" : "It raised contrast by changing"} the protected CTA background from <span className="text-zinc-300">{contract.brand.protectedPrimaryColor}</span> to <span className="text-zinc-300">#2563EB</span>. ConstraintFix rejected and rolled it back; the next choice needs product judgment.
        </p>

        {!multiFile && <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold tracking-[0.08em]">
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-300">A11Y PASS</span>
          <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-rose-300">BRAND FAIL</span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-300">{contract.responsive.viewportWidth}PX LAYOUT PASS</span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-zinc-500">ROLLBACK COMPLETE</span>
        </div>}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.05] p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-300/10 text-sky-300"><GitBranch size={15} /></span>
              <ArrowRight size={14} className="text-zinc-600" />
            </div>
            <div className="mt-4 text-sm font-semibold text-zinc-100">Preserve brand</div>
            <div className="mt-1 text-[11px] leading-5 text-zinc-500">Keep {contract.brand.protectedPrimaryColor}. Replan all files: foreground contrast, mobile navigation and input semantics.</div>
            <GradientButton disabled={disabled} onClick={onPreserveBrand} className="mt-4 w-full min-w-0">Preserve Brand</GradientButton>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[0.05] text-zinc-400"><Sparkles size={15} /></span>
              <ArrowRight size={14} className="text-zinc-600" />
            </div>
            <div className="mt-4 text-sm font-semibold text-zinc-100">Allow visual change</div>
            <div className="mt-1 text-[11px] leading-5 text-zinc-500">Waive only the pricing brand token. Replan and verify header layout and form semantics.</div>
            <GradientButton disabled={disabled} onClick={onAllowChange} variant="variant" className="mt-4 w-full min-w-0">Allow Change</GradientButton>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-2 text-[11px] font-medium text-zinc-500 transition hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw size={12} /> Restart demo
          </button>
        </div>
      </div>
    </section>
    </BorderGlow>
  );
}
