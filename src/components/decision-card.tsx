import { ArrowRight, GitBranch, RotateCcw, ShieldAlert, Sparkles } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

interface DecisionCardProps {
  onPreserveBrand: () => void;
  onAllowChange: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function DecisionCard({ onPreserveBrand, onAllowChange, onReset, disabled = false }: DecisionCardProps) {
  return (
    <section className="panel relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-amber-300/[0.04] blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-amber-300">
          <ShieldAlert size={13} /> HUMAN DECISION REQUIRED
        </div>
        <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">Two valid constraints conflict.</h2>
        <p className="mt-2 max-w-xl text-xs leading-5 text-zinc-500">
          The latest patch satisfies WCAG contrast, but it changes the protected brand token from <span className="text-zinc-300">#60A5FA</span> to <span className="text-zinc-300">#2563EB</span>. ConstraintFix pauses instead of silently choosing for you.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={disabled}
            onClick={onPreserveBrand}
            className="group rounded-2xl border border-sky-400/20 bg-sky-400/[0.05] p-4 text-left transition hover:border-sky-300/40 hover:bg-sky-300/[0.08] disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-300/10 text-sky-300"><GitBranch size={15} /></span>
              <ArrowRight size={14} className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" />
            </div>
            <div className="mt-4 text-sm font-semibold text-zinc-100">Preserve brand</div>
            <div className="mt-1 text-[11px] leading-5 text-zinc-500">Reject the background-color change and search for another contrast strategy.</div>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={onAllowChange}
            className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[0.05] text-zinc-400"><Sparkles size={15} /></span>
              <ArrowRight size={14} className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" />
            </div>
            <div className="mt-4 text-sm font-semibold text-zinc-100">Allow visual change</div>
            <div className="mt-1 text-[11px] leading-5 text-zinc-500">Accept the new CTA background as an explicit human-approved exception.</div>
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <GradientButton disabled={disabled} onClick={onPreserveBrand}>Preserve Brand</GradientButton>
          <GradientButton disabled={disabled} variant="variant" onClick={onAllowChange}>Allow Change</GradientButton>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-2 text-[11px] font-medium text-zinc-500 transition hover:text-zinc-200"
          >
            <RotateCcw size={12} /> Restart demo
          </button>
        </div>
      </div>
    </section>
  );
}
