import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Code2, Cpu, ShieldCheck } from "lucide-react";
import { agentProvider, requestedProvider } from "@/agent/provider";
import type { AgentEvent, AgentPhase, VerificationResult } from "@/agent/types";
import constraintFixLogo from "@/assets/constraintfix-logo.png";
import { AgentTimeline } from "@/components/agent-timeline";
import { ConstraintPanel } from "@/components/constraint-panel";
import { ControlPanel } from "@/components/control-panel";
import { DecisionCard } from "@/components/decision-card";
import { LivePreview } from "@/components/live-preview";
import { ScrambledText } from "@/components/ui/scrambled-text";
import { verifyInterface } from "@/verification/constraints";

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const nextPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

function App() {
  const previewRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const [stage, setStage] = useState(0);
  const [phase, setPhase] = useState<AgentPhase>("idle");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [brandOverride, setBrandOverride] = useState(false);

  const addEvent = (
    eventPhase: AgentPhase,
    title: string,
    detail?: string,
    tone: AgentEvent["tone"] = "neutral",
  ) => {
    setEvents((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        phase: eventPhase,
        title,
        detail,
        tone,
        timestamp: Date.now(),
      },
    ]);
  };

  const verify = async () => {
    if (!previewRef.current || !cardRef.current || !ctaRef.current) {
      throw new Error("Preview refs are not mounted.");
    }
    const result = await verifyInterface(previewRef.current, cardRef.current, ctaRef.current);
    setVerification(result);
    return result;
  };

  const waitForRenderedStage = async (nextStage: number) => {
    const expected = nextStage === 2 ? "rgb(37, 99, 235)" : "rgb(96, 165, 250)";

    for (let frame = 0; frame < 12; frame += 1) {
      const cta = ctaRef.current;
      const hasAccessibleName = nextStage === 0 || cta?.ownerDocument.querySelector("button[aria-label='Plan information']");
      const backgroundMatches = cta && window.getComputedStyle(cta).backgroundColor === expected;

      if (hasAccessibleName && backgroundMatches) return;
      await nextPaint();
    }

    throw new Error(`Rendered stage ${nextStage} did not commit before verification.`);
  };

  const setRenderedStage = async (nextStage: number) => {
    // Verification is only allowed after React has committed the new inline CTA styles.
    flushSync(() => setStage(nextStage));
    setPhase("rendering");
    addEvent("rendering", "Rendered updated component", `Patch stage ${nextStage} is now live in the browser.`);
    await waitForRenderedStage(nextStage);
  };

  const requestDecision = async (input: Parameters<typeof agentProvider.decide>[0]) => {
    const decision = await agentProvider.decide(input);
    if (decision.fallbackNotice) {
      addEvent("planning", "Demo-safe fallback engaged", decision.fallbackNotice, "warning");
    }
    return decision;
  };

  const startRepair = async () => {
    if (running) return;
    setRunning(true);
    setBrandOverride(false);
    setEvents([]);
    setVerification(null);
    setStage(0);

    try {
      await nextPaint();
      setPhase("auditing");
      addEvent("auditing", "Auditing rendered interface", "Running axe-core plus deterministic contrast, layout, and brand checks.");
      const initial = await verify();
      addEvent(
        "auditing",
        `${initial.axeViolations.length} accessibility rule violation${initial.axeViolations.length === 1 ? "" : "s"} detected`,
        `CTA contrast is ${initial.contrastRatio.toFixed(2)}:1. WCAG AA requires 4.5:1 for this text size.`,
        "warning",
      );

      setPhase("planning");
      addEvent("planning", "Planning lowest-risk repair", "The decision layer receives the same structured verification snapshot the executor will enforce.");
      const firstDecision = await requestDecision({ phase: "planning", stage: 0, verification: initial });
      addEvent("planning", "Safe autonomous action selected", firstDecision.reason, "success");

      setPhase("patching");
      addEvent("patching", "Added accessible name", "Inserted aria-label=\"Plan information\" on the icon button.", "success");
      await setRenderedStage(1);

      setPhase("verifying");
      addEvent("verifying", "Re-running verification", "Checking whether the safe patch changed any protected constraints.");
      const afterSafeFix = await verify();
      addEvent(
        "verifying",
        afterSafeFix.accessibilityPass ? "Accessibility now passes" : "Contrast issue remains",
        `Remaining contrast ratio: ${afterSafeFix.contrastRatio.toFixed(2)}:1. Brand and layout are still intact.`,
        afterSafeFix.accessibilityPass ? "success" : "warning",
      );

      setPhase("planning");
      const secondDecision = await requestDecision({ phase: "planning", stage: 1, verification: afterSafeFix });
      addEvent("planning", "Contrast repair proposed", secondDecision.reason);

      setPhase("patching");
      addEvent("patching", "Darkened CTA background", "Changed #60A5FA → #2563EB to improve white-text contrast.");
      await setRenderedStage(2);

      setPhase("verifying");
      addEvent("verifying", "Verifying repair against every constraint", "A successful WCAG result is not enough if another contract is broken.");
      const conflictResult = await verify();
      addEvent("verifying", "Accessibility check passed", `CTA contrast is now ${conflictResult.contrastRatio.toFixed(2)}:1.`, "success");
      if (!conflictResult.brandPass) {
        addEvent("conflict", "Protected brand token failed", `Rendered CTA background is ${conflictResult.brandColor}; expected rgb(96, 165, 250).`, "danger");
      }

      const conflictDecision = await requestDecision({ phase: "conflict", stage: 2, verification: conflictResult });
      if (conflictDecision.type === "request_human") {
        setPhase("waiting_for_human");
        addEvent("waiting_for_human", "Agent paused for product judgment", conflictDecision.reason, "warning");
      }
    } catch (error) {
      console.error(error);
      setPhase("failed");
      addEvent("failed", "Execution failed", error instanceof Error ? error.message : "Unknown error", "danger");
    } finally {
      setRunning(false);
    }
  };

  const preserveBrand = async () => {
    if (running) return;
    setRunning(true);
    try {
      setPhase("replanning");
      addEvent("replanning", "Human chose: preserve brand", "The rejected patch remains visible in history, but the protected token cannot change.", "success");
      const decision = await requestDecision({
        phase: "replanning",
        stage: 2,
        verification,
        humanChoice: "preserve_brand",
      });
      addEvent("replanning", "Replanned around the protected constraint", decision.reason);
      await sleep(220);

      setPhase("patching");
      addEvent("patching", "Changed foreground instead of brand surface", "Restored #60A5FA and changed CTA text from white to #0F172A.", "success");
      await setRenderedStage(3);

      setPhase("verifying");
      addEvent("verifying", "Running final deterministic proof", "axe-core, contrast math, brand-token equality, and DOM overflow checks all run again.");
      const finalResult = await verify();

      if (finalResult.accessibilityPass && finalResult.brandPass && finalResult.layoutPass) {
        setPhase("complete");
        addEvent("complete", "All constraints verified", `Accessibility PASS · Brand PASS · Layout PASS · contrast ${finalResult.contrastRatio.toFixed(2)}:1`, "success");
      } else {
        setPhase("failed");
        addEvent("failed", "Final verification failed", "At least one deterministic constraint still fails.", "danger");
      }
    } catch (error) {
      console.error(error);
      setPhase("failed");
      addEvent("failed", "Replan failed", error instanceof Error ? error.message : "Unknown error", "danger");
    } finally {
      setRunning(false);
    }
  };

  const allowChange = async () => {
    if (running) return;
    setRunning(true);
    setBrandOverride(true);
    addEvent("waiting_for_human", "Human approved brand exception", "The CTA color change is retained as an explicit, traceable override.", "warning");
    await sleep(350);
    setPhase("complete");
    addEvent("complete", "Completed with one human-approved exception", "Accessibility and layout pass; the protected brand constraint is intentionally overridden.", "warning");
    setRunning(false);
  };

  const reset = () => {
    setStage(0);
    setPhase("idle");
    setEvents([]);
    setVerification(null);
    setRunning(false);
    setBrandOverride(false);
  };

  return (
    <main className="min-h-screen bg-[#07090d] text-zinc-100 selection:bg-sky-400/20">
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-12 sm:px-6 lg:px-8">
        <header className="flex min-h-20 items-center justify-between border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="brand-lockup"><img src={constraintFixLogo} alt="ConstraintFix" /></div>
            <div>
              <div className="mt-0.5 text-[10px] text-zinc-600">Constraint-aware frontend repair agent</div>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[10px] text-zinc-500">TRACK 04</span>
            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-semibold text-emerald-300">DEMO MODE · {requestedProvider}</span>
          </div>
        </header>

        <section className="grid gap-6 py-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="section-kicker">NEXT-GEN PRODUCTIVITY & AUTOMATION</div>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              Agents should fix interfaces <ScrambledText className="text-zinc-500">without breaking what matters.</ScrambledText>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-500">
              ConstraintFix lets a coding agent audit, repair, render, observe, recover from conflicting requirements, involve a human only when judgment is needed, and prove the final result with deterministic tools.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="metric-card"><Cpu size={14} /><span>Reason</span><strong>{requestedProvider}</strong></div>
            <div className="metric-card"><Code2 size={14} /><span>Execute</span><strong>Live</strong></div>
            <div className="metric-card"><ShieldCheck size={14} /><span>Verify</span><strong>Live</strong></div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
          <LivePreview stage={stage} previewRef={previewRef} cardRef={cardRef} ctaRef={ctaRef} />
          <AgentTimeline phase={phase} events={events} />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
          <ConstraintPanel result={verification} brandOverride={brandOverride} />
          {phase === "waiting_for_human" ? (
            <DecisionCard onPreserveBrand={preserveBrand} onAllowChange={allowChange} onReset={reset} disabled={running} />
          ) : (
            <ControlPanel phase={phase} running={running} onStart={startRepair} onReset={reset} />
          )}
        </section>

        <footer className="mt-6 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[10px] text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{agentProvider.label}</span>
          <span>axe-core · DOM geometry · WCAG contrast math · protected-token equality</span>
        </footer>
      </div>
    </main>
  );
}

export default App;
