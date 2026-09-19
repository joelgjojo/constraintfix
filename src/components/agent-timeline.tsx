import { Check, Circle, AlertTriangle, LoaderCircle, X } from "lucide-react";
import type { AgentEvent, AgentPhase } from "@/agent/types";
import { cn } from "@/lib/utils";
import { Strands } from "@/components/ui/strands";
import { ThoughtLine } from "@/components/ui/thought-line";

interface AgentTimelineProps {
  phase: AgentPhase;
  events: AgentEvent[];
}

const phaseOrder: { phase: AgentPhase; label: string }[] = [
  { phase: "auditing", label: "Audit interface" },
  { phase: "planning", label: "Plan repair" },
  { phase: "patching", label: "Apply patch" },
  { phase: "rendering", label: "Render result" },
  { phase: "verifying", label: "Verify constraints" },
];

const activeIndex = (phase: AgentPhase) => phaseOrder.findIndex((step) => step.phase === phase);

export function AgentTimeline({ phase, events }: AgentTimelineProps) {
  const index = activeIndex(phase);
  const inDecision = phase === "conflict" || phase === "waiting_for_human" || phase === "replanning";
  const working = ["auditing", "planning", "patching", "rendering", "verifying", "replanning"].includes(phase);
  const thoughtSteps = events.slice(-3).map((event) => event.title);

  return (
    <section className="panel relative min-h-[560px] overflow-hidden">
      <Strands active={working} className="pointer-events-none absolute inset-x-0 bottom-0 h-36 opacity-40" />
      <div className="panel-header relative">
        <div>
          <div className="section-kicker">AGENT EXECUTION</div>
          <h2 className="mt-1 text-sm font-semibold text-zinc-100">Repair timeline</h2>
        </div>
        <span className={cn("status-pill", phase === "complete" && "status-pass", phase === "failed" && "status-fail", phase === "waiting_for_human" && "status-warn")}> 
          {phase.replaceAll("_", " ")}
        </span>
      </div>

      <div className="relative grid gap-7 p-5 md:grid-cols-[170px_1fr]">
        <div className="space-y-1">
          {phaseOrder.map((step, stepIndex) => {
            const complete = phase === "complete" || index > stepIndex || inDecision;
            const active = index === stepIndex && !inDecision;
            return (
              <div key={step.phase} className="flex items-center gap-2.5 py-2 text-xs">
                <span className={cn("grid h-5 w-5 place-items-center rounded-full border", complete ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : active ? "border-sky-400/30 bg-sky-400/10 text-sky-300" : "border-white/10 text-zinc-600")}>
                  {complete ? <Check size={11} /> : active ? <LoaderCircle size={11} className="animate-spin" /> : <Circle size={8} />}
                </span>
                <span className={cn(complete ? "text-zinc-300" : active ? "text-white" : "text-zinc-600")}>{step.label}</span>
              </div>
            );
          })}
          <div className="my-3 h-px bg-white/[0.06]" />
          <div className="flex items-center gap-2.5 py-2 text-xs">
            <span className={cn("grid h-5 w-5 place-items-center rounded-full border", inDecision ? "border-amber-400/30 bg-amber-400/10 text-amber-300" : phase === "complete" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-zinc-600")}>
              {phase === "complete" ? <Check size={11} /> : inDecision ? <AlertTriangle size={11} /> : <Circle size={8} />}
            </span>
            <span className={cn(inDecision ? "text-amber-200" : phase === "complete" ? "text-zinc-300" : "text-zinc-600")}>Resolve trade-off</span>
          </div>
        </div>

        <div className="max-h-[410px] min-h-[360px] overflow-y-auto pr-2">
          {events.length === 0 ? (
            <div className="grid h-[330px] place-items-center rounded-xl border border-dashed border-white/10 bg-black/10 text-center text-xs leading-5 text-zinc-600">
              Agent events will appear here.<br />Start the repair when you are ready.
            </div>
          ) : (
            <div className="space-y-1">
              <ThoughtLine
                working={working}
                label="Agent is reasoning through the repair"
                doneLabel={phase === "complete" ? "Verified trace settled in" : "Agent trace paused after"}
                steps={thoughtSteps}
                className="mb-3 rounded-xl border border-sky-400/10 bg-sky-400/[0.035] px-3 py-2"
              />
              {events.map((event, idx) => (
                <div key={event.id} className="relative flex gap-3 py-2.5">
                  {idx < events.length - 1 && <span className="absolute left-[6px] top-[24px] h-[calc(100%-8px)] w-px bg-white/[0.07]" />}
                  <span className={cn("relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-[#0b0e12]", event.tone === "success" ? "bg-emerald-400" : event.tone === "warning" ? "bg-amber-400" : event.tone === "danger" ? "bg-rose-400" : "bg-zinc-500")} />
                  <div>
                    <div className="text-xs font-medium text-zinc-200">{event.title}</div>
                    {event.detail && <p className="mt-1 text-[11px] leading-5 text-zinc-500">{event.detail}</p>}
                  </div>
                </div>
              ))}
              {phase === "failed" && (
                <div className="mt-3 flex items-center gap-2 text-xs text-rose-300"><X size={13} />Execution stopped</div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
