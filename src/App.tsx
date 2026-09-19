import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Code2, Cpu, ShieldCheck } from "lucide-react";
import { agentProvider, requestedProvider } from "@/agent/provider";
import type { AgentEvent, AgentPhase, DecisionSource, VerificationResult } from "@/agent/types";
import constraintFixLogo from "@/assets/constraintfix-logo.png";
import { AgentSignal } from "@/components/agent-signal";
import { AgentTimeline } from "@/components/agent-timeline";
import { ConstraintPanel } from "@/components/constraint-panel";
import { ConstraintReceipt } from "@/components/constraint-receipt";
import { ControlPanel } from "@/components/control-panel";
import { DecisionCard } from "@/components/decision-card";
import { LivePreview } from "@/components/live-preview";
import Ferrofluid from "@/components/ui/ferrofluid";
import { ScrambledText } from "@/components/ui/scrambled-text";
import {
  createConstraintReceipt,
  createRepairTransaction,
  toVerificationSnapshot,
  updateCandidate,
  updateTransaction,
} from "@/transactions/contract";
import type { ConstraintReceipt as ConstraintReceiptData, RepairTransaction } from "@/transactions/types";
import { verifyInterface } from "@/verification/constraints";

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const nextPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const ferrofluidColors = ["#000000", "#080445", "#003cff"];

function configuredSource(): DecisionSource {
  const mode = import.meta.env.VITE_AGENT_MODE ?? import.meta.env.VITE_AGENT_PROVIDER;
  return mode === "live" || mode === "openai" ? "openai" : "mock";
}

function App() {
  const previewRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const [stage, setStage] = useState(0);
  const [phase, setPhase] = useState<AgentPhase>("idle");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [transaction, setTransaction] = useState<RepairTransaction | null>(null);
  const [receipt, setReceipt] = useState<ConstraintReceiptData | null>(null);
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
    const expectedForeground = nextStage === 3 ? "rgb(15, 23, 42)" : "rgb(255, 255, 255)";

    for (let frame = 0; frame < 12; frame += 1) {
      const cta = ctaRef.current;
      const hasAccessibleName = nextStage === 0 || cta?.ownerDocument.querySelector("button[aria-label='Plan information']");
      const backgroundMatches = cta && window.getComputedStyle(cta).backgroundColor === expected;
      const foregroundMatches = cta && window.getComputedStyle(cta).color === expectedForeground;

      if (hasAccessibleName && backgroundMatches && foregroundMatches) return;
      await nextPaint();
    }

    throw new Error(`Rendered stage ${nextStage} did not commit before verification.`);
  };

  const setRenderedStage = async (nextStage: number) => {
    flushSync(() => setStage(nextStage));
    setPhase("rendering");
    addEvent("rendering", "Rendered candidate state", `Patch stage ${nextStage} is now live in the browser.`);
    await waitForRenderedStage(nextStage);
  };

  const requestDecision = async (input: Parameters<typeof agentProvider.decide>[0]) => {
    const decision = await agentProvider.decide(input);
    if (decision.fallbackNotice) {
      addEvent("planning", "Demo-safe fallback engaged", decision.fallbackNotice, "warning");
    }
    return decision;
  };

  const failTransaction = (detail: string) => {
    setTransaction((current) =>
      current ? updateTransaction(current, "failed", { completedAt: new Date().toISOString() }) : current,
    );
    setPhase("failed");
    addEvent("failed", "Transaction stopped safely", detail, "danger");
  };

  const startRepair = async () => {
    if (running) return;
    setRunning(true);
    setBrandOverride(false);
    setEvents([]);
    setVerification(null);
    setTransaction(null);
    setReceipt(null);
    flushSync(() => setStage(0));

    try {
      await waitForRenderedStage(0);
      setPhase("auditing");
      addEvent("auditing", "Inspecting rendered interface", "Running axe-core, WCAG contrast, protected-token, and 375px overflow checks.");
      const initial = await verify();
      let currentTransaction = createRepairTransaction(toVerificationSnapshot(initial), configuredSource());
      setTransaction(currentTransaction);
      addEvent("auditing", "Contract loaded · CF-018", "WCAG AA, #60A5FA protection, 375px no-overflow, and autonomy policy are enforceable gates.", "success");
      addEvent(
        "auditing",
        `${initial.axeViolations.length} accessibility rule violation${initial.axeViolations.length === 1 ? "" : "s"} detected`,
        `CTA contrast is ${initial.contrastRatio.toFixed(2)}:1. WCAG AA requires 4.5:1 for this text size.`,
        "warning",
      );

      setPhase("planning");
      addEvent("planning", "Selecting low-risk autonomous repair", "The decision provider receives evidence; deterministic tools remain the authority.");
      const firstDecision = await requestDecision({ phase: "planning", stage: 0, verification: initial });
      currentTransaction = {
        ...currentTransaction,
        source: firstDecision.source,
        candidates: currentTransaction.candidates.map((candidate) => ({ ...candidate, source: firstDecision.source })),
      };
      setTransaction(currentTransaction);
      addEvent("planning", "Low-risk action approved", firstDecision.reason, "success");

      setPhase("patching");
      addEvent("patching", "Applied semantic repair", "Inserted aria-label=\"Plan information\" on the icon button.", "success");
      await setRenderedStage(1);

      setPhase("verifying");
      addEvent("verifying", "Verifying the safe repair", "The semantic repair must be proven against the same contract.");
      const afterSafeFix = await verify();
      addEvent(
        "verifying",
        afterSafeFix.accessibilityPass ? "Accessibility now passes" : "Contrast issue remains",
        `Remaining contrast ratio: ${afterSafeFix.contrastRatio.toFixed(2)}:1. Brand and layout are intact.`,
        afterSafeFix.accessibilityPass ? "success" : "warning",
      );

      setPhase("planning");
      const secondDecision = await requestDecision({ phase: "planning", stage: 1, verification: afterSafeFix });
      currentTransaction = updateCandidate(currentTransaction, "candidate-a", {
        status: "running",
        source: secondDecision.source,
        note: secondDecision.reason,
      });
      setTransaction(currentTransaction);
      addEvent("planning", "Candidate A started", secondDecision.reason);

      setPhase("patching");
      addEvent("patching", "Applied Candidate A", "Changed CTA background #60A5FA → #2563EB to improve white-text contrast.");
      await setRenderedStage(2);

      setPhase("verifying");
      addEvent("verifying", "Verifying Candidate A against every constraint", "A passing accessibility check cannot override a protected token.");
      const conflictResult = await verify();
      const conflictSnapshot = toVerificationSnapshot(conflictResult);
      currentTransaction = updateTransaction(
        updateCandidate(currentTransaction, "candidate-a", {
          status: "rejected",
          verification: conflictSnapshot,
          violatedConstraints: conflictResult.brandPass ? [] : ["Protected token --brand-primary (#60A5FA)"],
          note: "WCAG and layout passed; protected brand token changed.",
        }),
        "rejected",
      );
      setTransaction(currentTransaction);
      addEvent("verifying", "Candidate A accessibility PASS", `Contrast ${conflictResult.contrastRatio.toFixed(2)}:1 · 375px layout PASS`, "success");
      addEvent("conflict", "TRANSACTION REJECTED · protected brand token failed", `Observed ${conflictResult.brandColor}; contract requires rgb(96, 165, 250).`, "danger");
      setPhase("conflict");
      await sleep(420);

      setPhase("replanning");
      addEvent("replanning", "Automatic rollback started", "Restoring the last valid render before asking for a protected-constraint decision.", "warning");
      await setRenderedStage(1);
      setPhase("verifying");
      const rollbackResult = await verify();
      currentTransaction = updateTransaction(
        updateCandidate(currentTransaction, "candidate-a", { rollbackApplied: true }),
        "rolled_back",
        { rollbackCount: currentTransaction.rollbackCount + 1 },
      );
      setTransaction(currentTransaction);
      addEvent(
        "verifying",
        "ROLLBACK COMPLETE · prior render re-verified",
        `Semantic repair retained. Brand ${rollbackResult.brandPass ? "PASS" : "FAIL"} · 375px layout ${rollbackResult.layoutPass ? "PASS" : "FAIL"}.`,
        "success",
      );

      const conflictDecision = await requestDecision({ phase: "conflict", stage: 2, verification: conflictResult });
      if (conflictDecision.type !== "request_human") {
        throw new Error("Decision provider returned an unsafe conflict response.");
      }
      currentTransaction = updateTransaction(currentTransaction, "waiting_for_human", {
        humanIntervention: { required: true, reason: conflictDecision.reason },
      });
      setTransaction(currentTransaction);
      setPhase("waiting_for_human");
      addEvent("waiting_for_human", "Autonomy paused for product judgment", conflictDecision.reason, "warning");
    } catch (error) {
      console.error(error);
      failTransaction(error instanceof Error ? error.message : "Unknown transaction error.");
    } finally {
      setRunning(false);
    }
  };

  const preserveBrand = async () => {
    if (running || !transaction) return;
    setRunning(true);
    let currentTransaction = updateTransaction(
      updateCandidate(transaction, "candidate-b", { status: "running" }),
      "running",
      { humanIntervention: { required: true, choice: "preserve_brand", reason: "Protected brand token must remain unchanged." } },
    );
    setTransaction(currentTransaction);

    try {
      setPhase("replanning");
      addEvent("replanning", "Human choice recorded · preserve brand", "Replanning around #60A5FA rather than bypassing the contract.", "success");
      const decision = await requestDecision({
        phase: "replanning",
        stage: 2,
        verification,
        humanChoice: "preserve_brand",
      });
      currentTransaction = {
        ...currentTransaction,
        source: decision.source,
        candidates: currentTransaction.candidates.map((candidate) => candidate.id === "candidate-b" ? { ...candidate, source: decision.source, note: decision.reason } : candidate),
      };
      setTransaction(currentTransaction);
      addEvent("replanning", "Candidate B selected", decision.reason);
      await sleep(180);

      setPhase("patching");
      addEvent("patching", "Applied Candidate B", "Kept #60A5FA and changed CTA text #FFFFFF → #0F172A.", "success");
      await setRenderedStage(3);

      setPhase("verifying");
      addEvent("verifying", "Running final deterministic proof", "axe-core, contrast math, token equality, and DOM geometry run again.");
      const finalResult = await verify();
      const finalSnapshot = toVerificationSnapshot(finalResult);

      if (!finalSnapshot.overallPass) {
        throw new Error("Candidate B did not satisfy every deterministic constraint.");
      }

      currentTransaction = updateTransaction(
        updateCandidate(currentTransaction, "candidate-b", {
          status: "accepted",
          verification: finalSnapshot,
          violatedConstraints: [],
          note: "All deterministic constraints passed.",
        }),
        "accepted",
        { completedAt: new Date().toISOString(), finalVerification: finalSnapshot },
      );
      setTransaction(currentTransaction);
      setReceipt(createConstraintReceipt(currentTransaction));
      setPhase("complete");
      addEvent("complete", "TRANSACTION ACCEPTED", `Accessibility PASS · Brand PASS · Layout PASS · contrast ${finalResult.contrastRatio.toFixed(2)}:1`, "success");
      addEvent("complete", "Constraint receipt generated", "CF-018 records original violations, both candidates, rollback, final proof, and the human decision.", "success");
    } catch (error) {
      console.error(error);
      failTransaction(error instanceof Error ? error.message : "Candidate B failed.");
    } finally {
      setRunning(false);
    }
  };

  const allowChange = async () => {
    if (running || !transaction) return;
    setRunning(true);
    let currentTransaction = updateTransaction(
      updateCandidate(transaction, "candidate-a", { status: "running", rollbackApplied: false }),
      "running",
      { humanIntervention: { required: true, choice: "allow_change", reason: "Human approved a protected brand exception." } },
    );
    setTransaction(currentTransaction);

    try {
      const decision = await requestDecision({
        phase: "waiting_for_human",
        stage: 2,
        verification,
        humanChoice: "allow_change",
      });
      addEvent("waiting_for_human", "Human-approved exception recorded", decision.reason, "warning");
      setPhase("patching");
      await setRenderedStage(2);
      setPhase("verifying");
      const finalResult = await verify();
      const finalSnapshot = toVerificationSnapshot(finalResult);

      if (!finalSnapshot.accessibility.pass || !finalSnapshot.layout.pass) {
        throw new Error("The approved exception still failed a non-overridable constraint.");
      }

      currentTransaction = updateTransaction(
        updateCandidate(currentTransaction, "candidate-a", {
          status: "approved_exception",
          verification: finalSnapshot,
          violatedConstraints: ["Protected token --brand-primary (#60A5FA), human-approved"],
          note: "Human approved the visual token change.",
        }),
        "approved_exception",
        { completedAt: new Date().toISOString(), finalVerification: finalSnapshot },
      );
      setTransaction(currentTransaction);
      setReceipt(createConstraintReceipt(currentTransaction));
      setBrandOverride(true);
      setPhase("complete");
      addEvent("complete", "Completed with approved exception", "Accessibility and layout pass; brand protection remains visibly overridden.", "warning");
      addEvent("complete", "Constraint receipt generated", "CF-018 records the exception and its deterministic verification result.", "success");
    } catch (error) {
      console.error(error);
      failTransaction(error instanceof Error ? error.message : "Approved exception failed.");
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setStage(0);
    setPhase("idle");
    setEvents([]);
    setVerification(null);
    setTransaction(null);
    setReceipt(null);
    setRunning(false);
    setBrandOverride(false);
  };

  return (
    <main className="app-shell min-h-screen bg-[#07090d] text-zinc-100 selection:bg-sky-400/20">
      <Ferrofluid
        className="app-ferrofluid"
        colors={ferrofluidColors}
        speed={0.5}
        scale={1}
        turbulence={1}
        fluidity={0.1}
        rimWidth={0.2}
        sharpness={3}
        shimmer={1}
        glow={2}
        flowDirection="down"
        opacity={1}
        mouseInteraction
        mouseStrength={1}
        mouseRadius={0.3}
      />
      <div className="relative z-10 mx-auto w-full max-w-[1480px] px-4 pb-12 sm:px-6 lg:px-8">
        <header className="flex min-h-20 items-center justify-between border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="brand-lockup"><img src={constraintFixLogo} alt="ConstraintFix" /></div>
            <div className="mt-0.5 text-[10px] text-zinc-600">AI Change Firewall for coding agents</div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[10px] text-zinc-500">TRACK 04</span>
            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-semibold text-emerald-300">AGENT READY · {requestedProvider}</span>
          </div>
        </header>

        <section className="grid gap-6 py-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="section-kicker">NEXT-GEN PRODUCTIVITY & AUTOMATION</div>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              <ScrambledText>AI Change Firewall</ScrambledText> <span className="text-zinc-500">for coding agents.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-500">
              Agents propose code changes. ConstraintFix verifies the rendered result before trust: it enforces a visible contract, rejects unsafe candidates, rolls state back, and records a proof receipt.
            </p>
          </div>

          <div className="grid gap-2">
            <AgentSignal phase={phase} provider={requestedProvider} />
            <div className="grid grid-cols-3 gap-2">
              <div className="metric-card"><Cpu size={14} /><span>Propose</span><strong>{requestedProvider}</strong></div>
              <div className="metric-card"><Code2 size={14} /><span>Execute</span><strong>Bounded</strong></div>
              <div className="metric-card"><ShieldCheck size={14} /><span>Verify</span><strong>Authority</strong></div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
          <LivePreview stage={stage} previewRef={previewRef} cardRef={cardRef} ctaRef={ctaRef} />
          <AgentTimeline phase={phase} events={events} transaction={transaction} />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
          <ConstraintPanel result={verification} brandOverride={brandOverride} />
          {phase === "waiting_for_human" ? (
            <DecisionCard onPreserveBrand={preserveBrand} onAllowChange={allowChange} onReset={reset} disabled={running} />
          ) : (
            <ControlPanel phase={phase} running={running} onStart={startRepair} onReset={reset} />
          )}
        </section>

        {receipt && <div className="mt-4"><ConstraintReceipt receipt={receipt} /></div>}

        <footer className="mt-6 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[10px] text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{agentProvider.label}</span>
          <span>axe-core · DOM geometry · WCAG contrast math · protected-token equality</span>
        </footer>
      </div>
    </main>
  );
}

export default App;
