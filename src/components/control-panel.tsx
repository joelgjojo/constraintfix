import { RotateCcw, Sparkles, TerminalSquare } from "lucide-react";
import type { AgentPhase } from "@/agent/types";
import { LatticeLoader } from "@/components/ui/lattice-loader";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

interface ControlPanelProps {
  phase: AgentPhase;
  running: boolean;
  onStart: () => void;
  onReset: () => void;
}

export function ControlPanel({ phase, running, onStart, onReset }: ControlPanelProps) {
  const complete = phase === "complete";
  const waiting = phase === "waiting_for_human";
  const failed = phase === "failed";
  const loaderStatus = complete ? "done" : failed ? "error" : running ? "working" : "idle";
  const loaderLabel = complete ? "Proof complete" : failed ? "Repair stopped" : running ? "Deterministic checks live" : "Ready to verify";

  return (
    <section className="panel relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-blue-500/[0.07] blur-3xl" />
      <div className="relative flex min-h-[242px] flex-col justify-between">
        <div>
          <div className="section-kicker">AGENT CONTROL</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400"><TerminalSquare size={15} /></span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                {complete ? "Verified repair complete" : waiting ? "Agent paused for judgment" : running ? "ConstraintFix is working" : "Ready to inspect the interface"}
              </h2>
              <p className="mt-0.5 text-[11px] text-zinc-600">
                {complete ? "All required constraints passed deterministic verification." : waiting ? "Autonomy stops where product judgment begins." : "The decision layer can use OpenAI, while execution and proof stay deterministic."}
              </p>
              <LatticeLoader status={loaderStatus} label={loaderLabel} className="mt-2" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {phase === "idle" ? (
            <LiquidMetalButton label="Start Repair" onClick={onStart} disabled={running} />
          ) : (
            <button
              type="button"
              onClick={onReset}
              disabled={running}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RotateCcw size={14} /> Reset demo
            </button>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600"><Sparkles size={12} /> deterministic tools stay live</div>
        </div>
      </div>
    </section>
  );
}
