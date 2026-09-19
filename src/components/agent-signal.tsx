import { Activity, Eye, ScanLine, ShieldCheck } from "lucide-react";
import type { AgentPhase } from "@/agent/types";
import { BorderGlow } from "@/components/ui/border-glow";
import { CursorGrid } from "@/components/ui/cursor-grid";
import { Ferrofluid } from "@/components/ui/ferrofluid";
import { LatticeLoader } from "@/components/ui/lattice-loader";
import { ScrambledText } from "@/components/ui/scrambled-text";
import { Strands } from "@/components/ui/strands";

interface AgentSignalProps {
  phase: AgentPhase;
  provider: string;
}

const workingPhases: AgentPhase[] = ["auditing", "planning", "patching", "rendering", "verifying", "replanning"];

const readablePhase = (phase: AgentPhase) => phase.replaceAll("_", " ");

export function AgentSignal({ phase, provider }: AgentSignalProps) {
  const working = workingPhases.includes(phase);
  const settled = phase === "complete";
  const failed = phase === "failed";
  const status = settled ? "done" : failed ? "error" : working ? "working" : "idle";
  const label = settled ? "Verification proof settled" : failed ? "Execution needs review" : working ? "Reasoning against constraints" : "Ready to inspect a live render";

  return (
    <BorderGlow className="agent-signal" glowColor="96, 165, 250" animated>
      <aside className="agent-signal__surface" aria-label="Live agent signal">
        <CursorGrid className="pointer-events-none absolute inset-0 opacity-90" color="#60A5FA" cellSize={24} radius={140} />
        <Ferrofluid active={working} className="pointer-events-none absolute -right-4 -top-10 h-56 w-56 opacity-95" />
        <Strands active className="pointer-events-none absolute inset-x-0 bottom-0 h-36 opacity-90" />

        <div className="agent-signal__content">
          <div className="agent-signal__topline">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-sky-200">
              <Activity size={13} aria-hidden="true" /> LIVE AGENT FIELD
            </div>
            <span className="agent-signal__phase">{readablePhase(phase)}</span>
          </div>

          <div className="mt-5 max-w-[235px]">
            <ScrambledText className="agent-signal__headline">Constraint-aware repair</ScrambledText>
            <p className="mt-1.5 text-[11px] leading-5 text-sky-100/55">A visible reasoning surface that stays connected to deterministic proof.</p>
          </div>

          <LatticeLoader status={status} label={label} className="mt-5" />

          <div className="agent-signal__nodes">
            <span><ScanLine size={11} aria-hidden="true" /> audit</span>
            <span><Eye size={11} aria-hidden="true" /> observe</span>
            <span><ShieldCheck size={11} aria-hidden="true" /> verify</span>
          </div>

          <div className="agent-signal__provider">{provider} decision layer · deterministic executor</div>
        </div>
      </aside>
    </BorderGlow>
  );
}
