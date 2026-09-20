import { useRef, useState } from 'react';
import type { AgentMode } from '@/agent/types';
import { changeRequest } from '@/transactions/change-set';
import { useChangeTransaction } from '@/transactions/use-change-transaction';
import logo from '@/assets/constraintfix-logo.png';
import Ferrofluid from '@/components/ui/ferrofluid';
import { Strands } from '@/components/ui/strands';
import { MagicBento } from '@/components/ui/magic-bento';
import { ControlPanel } from '@/components/control-panel';
import { DecisionCard } from '@/components/decision-card';
import { ChangeSetPreview } from '@/components/change-set-preview';
import { VerificationMatrix } from '@/components/verification-matrix';
import { ChangeSetReceipt, ProposedOperations } from '@/components/change-set-report';
import { AgentPlan, AgentTrace, AutomationSummary } from '@/components/agent-run';
import { DEFAULT_CONSTRAINT_CONTRACT } from '@/constraints/contract';
const colors = ['#000000', '#080445', '#003cff'];
const modeLabel: Record<AgentMode, string> = { replay: 'Bundled replay', mock: 'Mock', live: 'Optional live planner' };

export default function App() {
  // The judge experience starts offline, even if a live key is configured on the server.
  const [mode, setMode] = useState<AgentMode>('replay');
  const [resetKey, setResetKey] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const run = useChangeTransaction(root, mode, DEFAULT_CONSTRAINT_CONTRACT);
  const reset = () => { if (run.running) return; run.reset(); setResetKey(k => k + 1); };
  const exception = run.tx?.status === 'approved_exception';
  const label = run.phase === 'waiting_for_human' ? 'Baseline restored · rejected proposal retained below' : run.phase === 'complete' ? exception ? 'Replan rendered · explicit brand exception' : 'Replan rendered · all three files verified' : run.phase === 'idle' ? 'AI Checkout Redesign' : 'Inspecting the whole change set';
  return <main className="min-h-screen text-slate-100" data-testid="application" data-phase={run.phase}>
    <Ferrofluid className="app-ferrofluid" colors={colors} speed={0.5} scale={1} turbulence={1} fluidity={0.1} rimWidth={0.2} sharpness={3} shimmer={1} glow={2} flowDirection="down" opacity={1} mouseInteraction mouseStrength={1} mouseRadius={0.3} />
    <div className="relative z-10 mx-auto max-w-[1480px] px-4 pb-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 py-5"><div className="brand-lockup"><img src={logo} alt="ConstraintFix" /></div><div className="flex items-center gap-3"><span className="text-[10px] text-slate-400">TRACK 04</span><label className="text-xs text-slate-300">Planner <select aria-label="Planner mode" value={mode} disabled={run.phase !== 'idle'} onChange={e => setMode(e.target.value as AgentMode)} className="ml-2 rounded-lg border border-white/15 bg-[#101419] p-2 disabled:opacity-60"><option value="replay">BUNDLED REPLAY · offline</option><option value="mock">MOCK · offline</option><option value="live">OPTIONAL LIVE PLANNER</option></select></label></div></header>
      <section className="hero-motion py-7"><div className="hero-motion__art" aria-hidden="true"><Strands /><span className="hero-motion__halo" /></div><div className="section-kicker">NEXT-GEN PRODUCTIVITY & AUTOMATION</div><h1 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Agentic change review <span className="text-slate-500">for coding agents.</span></h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Automates the repetitive QA loop after an AI-generated frontend change: inspect, verify, rollback, replan and document. Your AI Change Firewall.</p></section>
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <MagicBento enableTilt={false} enableMagnetism={false} clickEffect={false} particleCount={5} glowColor="96, 165, 250"><section className="panel h-full p-5"><div className="section-kicker">AI CHANGE REQUEST · CS-CHECKOUT</div><h2 className="mt-3 text-lg font-medium leading-7">“{changeRequest}”</h2><div className="mt-4 flex flex-wrap gap-2"><span className="status-pill">Agent proposal · {modeLabel[mode]}</span><span className="status-pill">3 files</span><span className="status-pill">9 constraint gates</span><span className="status-pill">Atomic rollback</span><span className="status-pill">1 human policy boundary</span></div><p className="mt-3 text-xs text-slate-400">{mode === 'replay' ? 'Planner decisions replayed · tools and verification live' : mode === 'mock' ? 'Deterministic mock planner · tools and verification live' : 'Optional live planner · tools act and verifier determines truth'}</p></section></MagicBento>
        <ControlPanel phase={run.phase} running={run.running} brandOverride={exception} onStart={run.start} onReset={reset} />
      </section>
      <AgentPlan tx={run.tx} />
      <section className="panel my-4 p-5" aria-label="Organization constraint contract"><div className="section-kicker">POLICY SOURCE · CONSTRAINT CONTRACT V{run.contract.version}</div><div className="contract-grid mt-4"><div><strong>Accessibility</strong><p>Contrast ≥ {run.contract.accessibility.minimumContrast}:1 on CTAs<br />Selected axe violations ≤ {run.contract.accessibility.maxSelectedViolations}</p></div><div><strong>Protected brand</strong><p>--brand-primary <span className="text-sky-300">{run.contract.brand.protectedPrimaryColor}</span><br />All three action surfaces</p></div><div><strong>Responsive</strong><p>True {run.contract.responsive.viewportWidth}px surfaces<br />{run.contract.responsive.allowHorizontalOverflow ? 'Horizontal overflow allowed' : 'No horizontal overflow'}</p></div><div><strong>Semantics</strong><p>Named buttons<br />Associated input labels</p></div></div><p className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-400">Autonomy: semantic repair <b className="text-emerald-300">{run.contract.autonomy.lowRiskRepair.toUpperCase()}</b> · protected / ambiguous policy <b className="text-amber-300">{run.contract.autonomy.protectedConstraintChange.toUpperCase()}</b> · deterministic verifier <b className="text-rose-300">AUTHORITATIVE</b></p></section>
      <ChangeSetPreview key={resetKey} resetKey={String(resetKey)} state={run.fixtures} rootRef={root} label={label} contract={run.contract} />
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]"><div className="space-y-4"><VerificationMatrix result={run.matrix} label={run.matrixLabel} contract={run.contract} exception={exception} />
      {run.tx?.rollback && <div className="panel p-4" data-testid="rollback-proof"><div className="section-kicker">ATOMIC ROLLBACK PROOF</div><p className={`mt-2 text-sm ${run.tx.rollback.verified ? 'text-emerald-300' : 'text-rose-300'}`}>{run.tx.rollback.verified ? '3 fixtures restored · baseline re-verified' : 'Rollback verification failed'} · {run.tx.rollback.result.passed}/{run.tx.rollback.result.total}</p><p className="mt-1 text-xs text-slate-400">Every surface measured again after restoring the saved React state snapshot.</p></div>}
      {run.phase === 'waiting_for_human' && <DecisionCard onPreserveBrand={() => run.resolve('preserve_brand')} onAllowChange={() => run.resolve('allow_change')} onReset={reset} contract={run.contract} disabled={run.running} multiFile />}
      </div><div className="space-y-4"><AgentTrace tx={run.tx} /><ProposedOperations tx={run.tx} /></div></section>
      {run.tx && run.receipt && <AutomationSummary tx={run.tx} receiptGenerated={Boolean(run.receipt)} />}
      {run.receipt && <div className="mt-4"><ChangeSetReceipt receipt={run.receipt} /></div>}
      <footer className="mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-slate-500"><span>Built with Codex · Agents propose. ConstraintFix proves.</span><br />The model never grades itself. This MVP verifies controlled React fixtures with selected axe rules, contrast math, computed styles and DOM measurements. Rollback restores browser state; it is not a git rollback or production CI integration. <span className="font-mono">Build {__BUILD_SHA__}</span></footer>
    </div>
  </main>;
}
