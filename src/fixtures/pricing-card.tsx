import { Info, Check } from "lucide-react";
import { forwardRef } from "react";

interface PricingCardProps {
  stage: number;
  ctaRef: React.Ref<HTMLButtonElement>;
}

export const PricingCard = forwardRef<HTMLDivElement, PricingCardProps>(
  ({ stage, ctaRef }, ref) => {
    const hasAccessibleName = stage >= 1;

    const ctaStyle =
      stage === 2
        ? { backgroundColor: "#2563EB", color: "#FFFFFF" }
        : stage >= 3
          ? { backgroundColor: "#60A5FA", color: "#0F172A" }
          : { backgroundColor: "#60A5FA", color: "#FFFFFF" };

    return (
      <div ref={ref} className={`pricing-card pricing-card--stage-${stage} w-full max-w-[340px] rounded-[24px] border border-white/10 bg-[#101419] p-6 shadow-2xl shadow-black/40`}>
        <span className="pricing-card__aura" aria-hidden="true" />
        <span className="pricing-card__scanline" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="pricing-card__eyebrow mb-1 text-[10px] font-bold tracking-[0.18em] text-sky-400">PRO PLAN</div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">Developer</h2>
          </div>
          <button
            type="button"
            aria-label={hasAccessibleName ? "Plan information" : undefined}
            className="pricing-card__info grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400"
          >
            <Info size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="pricing-card__price mt-8 flex items-end gap-2">
          <span className="text-4xl font-semibold tracking-[-0.05em] text-white">₹999</span>
          <span className="pb-1 text-xs text-zinc-500">/ month</span>
        </div>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Advanced tooling for developers shipping production interfaces.
        </p>

        <div className="pricing-card__divider my-6 h-px bg-white/[0.07]" />

        <ul className="space-y-3 text-sm text-zinc-300">
          {["Unlimited projects", "Advanced analytics", "Priority support"].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/[0.05] text-zinc-400">
                <Check size={12} aria-hidden="true" />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <button
          ref={ctaRef}
          type="button"
          style={ctaStyle}
          className="pricing-card__cta mt-7 w-full rounded-xl px-4 py-3 text-sm font-bold shadow-lg shadow-black/20 transition-colors"
        >
          Get Pro
        </button>
      </div>
    );
  },
);

PricingCard.displayName = "PricingCard";
