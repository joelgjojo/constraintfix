import { Check, Circle, AlertTriangle, LoaderCircle, X } from "lucide-react";
import type { AgentEvent, AgentPhase } from "@/agent/types";
import type { RepairTransaction } from "@/transactions/types";
import { cn } from "@/lib/utils";
import { CandidateComparison } from "@/components/candidate-comparison";
import { Strands } from "@/components/ui/strands";

interface AgentTimelineProps {
  phase: AgentPhase;
  events: AgentEvent[];
  transaction: RepairTransaction | null;
}

const phaseOrder: { phase: AgentPhase; label: string }[] = [
  { phase: "auditing", label: "Audit interface" },
  { phase: "planning", label: "Plan repair" },
  { phase: "patching", label: "Apply patch" },
  { phase: "rendering", label: "Render result" },
  { phase: "verifying", label: "Verify constraints" },
];

const activeIndex = (phase: AgentPhase) => phaseOrder.findIndex((step) => step.phase === phase);

export function AgentTimeline({ phase, events, transaction }: AgentTimelineProps) {
  const index = activeIndex(phase);
  const inDecision = phase === "conflict" || phase === "waiting_for_human" || phase === "replanning";
  const working = ["auditing", "planning", "patching", "rendering", "verifying", "replanning"].includes(phase);

  return (
    <section className="panel relative min-h-[560px] overflow-hidden">
      <Strands active={working} className="pointer-events-none absolute inset-x-0 bottom-0 h-36 opacity-40" />
      <div className="panel-header relative">
        <div>
          <div className="section-kicker">REPAIR RUN · {transaction?.id ?? "CF-018"}</div>
          <h2 className="mt-1 text-sm font-semibold text-zinc-100">Firewall transaction</h2>
        </div>
        <span className={cn("status-pill", phase === "complete" && "status-pass", phase === "failed" && "status-fail", phase === "waiting_for_human" && "status-warn")}> 
          {transaction?.status?.replaceAll("_", " ") ?? phase.replaceAll("_", " ")}
        </span>
      </div>

      <div className="relative grid gap-5 p-5 md:grid-cols-[160px_1fr]">
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

        <div className="min-w-0">
          {transaction && <CandidateComparison candidates={transaction.candidates} />}
          <div className="mt-4 max-h-[250px] min-h-[190px] overflow-y-auto pr-2">
          {events.length === 0 ? (
            <div className="grid h-[190px] place-items-center rounded-xl border border-dashed border-white/10 bg-black/10 text-center text-xs leading-5 text-zinc-600">
              Operational events will appear here.<br />Start the repair when you are ready.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="mb-2 text-[9px] font-bold tracking-[0.13em] text-zinc-600">OPERATIONAL TRACE</div>
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
      </div>
    </section>
  );
}
