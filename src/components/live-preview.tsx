import { Monitor, Smartphone } from "lucide-react";
import { PricingCard } from "@/fixtures/pricing-card";
import { CursorGrid } from "@/components/ui/cursor-grid";

interface LivePreviewProps {
  stage: number;
  previewRef: React.RefObject<HTMLDivElement>;
  cardRef: React.RefObject<HTMLDivElement>;
  ctaRef: React.RefObject<HTMLButtonElement>;
}

const stageLabels: Record<number, string> = {
  0: "Original",
  1: "Safe patch",
  2: "Conflict patch",
  3: "Verified repair",
};

export function LivePreview({ stage, previewRef, cardRef, ctaRef }: LivePreviewProps) {
  return (
    <section className="panel flex min-h-[560px] flex-col overflow-hidden">
      <div className="panel-header">
        <div>
          <div className="section-kicker">LIVE RENDER</div>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">PricingCard.tsx</h2>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-500">
              {stageLabels[stage] ?? "Working"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1 text-zinc-500">
          <span className="rounded-md bg-white/[0.06] p-1.5 text-zinc-300"><Smartphone size={13} /></span>
          <span className="p-1.5"><Monitor size={13} /></span>
          <span className="px-1.5 text-[10px]">375px</span>
        </div>
      </div>

      <div
        className="relative grid flex-1 place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_15%,rgba(56,189,248,0.08),transparent_32%),linear-gradient(#090c10,#080a0d)] p-5"
      >
        <CursorGrid className="pointer-events-none absolute inset-0 opacity-70" color="#60A5FA" cellSize={30} radius={130} />
        <div
          ref={previewRef}
          className="relative w-full max-w-[375px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080a0d] p-4 shadow-2xl shadow-black/30"
        >
          <PricingCard stage={stage} ref={cardRef} ctaRef={ctaRef} />
        </div>
      </div>
    </section>
  );
}
