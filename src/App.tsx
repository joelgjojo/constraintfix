import { useRef, useState } from 'react';
import type { AgentMode } from '@/agent/types';
import { changeRequest } from '@/transactions/change-set';
import { useChangeTransaction } from '@/transactions/use-change-transaction';
import logo from '@/assets/constraintfix-logo.png';
import Ferrofluid from '@/components/ui/ferrofluid';
import { MagicBento } from '@/components/ui/magic-bento';
import { ControlPanel } from '@/components/control-panel';
import { DecisionCard } from '@/components/decision-card';
import { ChangeSetPreview } from '@/components/change-set-preview';
import { VerificationMatrix } from '@/components/verification-matrix';
import { ChangeSetReceipt, ProposedOperations, TransactionTrace } from '@/components/change-set-report';
const colors = ['#000000', '#080445', '#003cff'];

export default function App() {
  // The judge experience starts offline, even if a live key is configured on the server.
  const [mode, setMode] = useState<AgentMode>('mock');
  const [resetKey, setResetKey] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const run = useChangeTransaction(root, mode);
  const reset = () => { if (run.running) return; run.reset(); setResetKey(k => k + 1); };
  const exception = run.tx?.status === 'approved_exception';
  const label = run.phase === 'waiting_for_human' ? 'Baseline restored · rejected proposal retained below' : run.phase === 'complete' ? exception ? 'Replan rendered · explicit brand exception' : 'Replan rendered · all three files verified' : run.phase === 'idle' ? 'AI Checkout Redesign' : 'Inspecting the whole change set';
  return <main className="min-h-screen text-slate-100" data-testid="application" data-phase={run.phase}>
    <Ferrofluid className="app-ferrofluid" colors={colors} speed={0.5} scale={1} turbulence={1} fluidity={0.1} rimWidth={0.2} sharpness={3} shimmer={1} glow={2} flowDirection="down" opacity={1} mouseInteraction mouseStrength={1} mouseRadius={0.3} />
    <div className="relative z-10 mx-auto max-w-[1480px] px-4 pb-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 py-5"><div className="brand-lockup"><img src={logo} alt="ConstraintFix" /></div><div className="flex items-center gap-3"><span className="text-[10px] text-slate-400">TRACK 04</span><label className="text-xs text-slate-300">Planner <select aria-label="Planner mode" value={mode} disabled={run.phase !== 'idle'} onChange={e => setMode(e.target.value as AgentMode)} className="ml-2 rounded-lg border border-white/15 bg-[#101419] p-2 disabled:opacity-60"><option value="mock">MOCK · offline</option><option value="replay">REPLAY · offline</option><option value="live">LIVE · uses API credits</option></select></label></div></header>
      <section className="py-7"><div className="section-kicker">NEXT-GEN PRODUCTIVITY & AUTOMATION</div><h1 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">AI Change Firewall <span className="text-slate-500">for coding agents.</span></h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">An agent changes three files. One regression blocks them all. Verify the rendered change set, roll it back atomically, and require proof before acceptance.</p></section>
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <MagicBento enableTilt={false} enableMagnetism={false} clickEffect={false} particleCount={5} glowColor="96, 165, 250"><section className="panel h-full p-5"><div className="section-kicker">AI CHANGE REQUEST · CS-CHECKOUT</div><h2 className="mt-3 text-lg font-medium leading-7">“{changeRequest}”</h2><div className="mt-4 flex flex-wrap gap-2"><span className="status-pill">Coding agent · {mode}</span><span className="status-pill">3 files</span><span className="status-pill">4 enforcement rules</span><span className="status-pill">Atomic acceptance</span></div><p className="mt-3 text-xs text-slate-400">Controlled browser demonstration · structured operations · no repository import</p></section></MagicBento>
        <ControlPanel phase={run.phase} running={run.running} brandOverride={exception} onStart={run.start} onReset={reset} />
      </section>
      <section className="panel my-4 p-5" aria-label="Organization constraint contract"><div className="section-kicker">PERSISTENT ORGANIZATION CONTRACT · CF-CONTRACT-01</div><div className="contract-grid mt-4"><div><strong>Accessibility</strong><p>AA contrast ≥ 4.5:1 on CTAs<br />Zero violations in selected axe rules</p></div><div><strong>Protected brand</strong><p>--brand-primary <span className="text-sky-300">#60A5FA</span><br />All three action surfaces</p></div><div><strong>Responsive</strong><p>True 375px surfaces<br />No horizontal overflow</p></div><div><strong>Semantics</strong><p>Named buttons<br />Associated input labels</p></div></div><p className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-400">Autonomy: semantic repair <b className="text-emerald-300">AUTO</b> · protected / ambiguous policy <b className="text-amber-300">ASK</b> · cross-file regression <b className="text-rose-300">REJECT</b></p></section>
      <ChangeSetPreview key={resetKey} resetKey={String(resetKey)} state={run.fixtures} rootRef={root} label={label} />
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]"><div className="space-y-4"><VerificationMatrix result={run.matrix} label={run.matrixLabel} exception={exception} />
      {run.tx?.rollback && <div className="panel p-4" data-testid="rollback-proof"><div className="section-kicker">ATOMIC ROLLBACK PROOF</div><p className={`mt-2 text-sm ${run.tx.rollback.verified ? 'text-emerald-300' : 'text-rose-300'}`}>{run.tx.rollback.verified ? '3 fixtures restored · baseline re-verified' : 'Rollback verification failed'} · {run.tx.rollback.result.passed}/{run.tx.rollback.result.total}</p><p className="mt-1 text-xs text-slate-400">Every surface measured again after restoring the saved React state snapshot.</p></div>}
      {run.phase === 'waiting_for_human' && <DecisionCard onPreserveBrand={() => run.resolve('preserve_brand')} onAllowChange={() => run.resolve('allow_change')} onReset={reset} disabled={run.running} multiFile />}
      </div><ProposedOperations tx={run.tx} /></section>
      {run.receipt && <div className="mt-4"><ChangeSetReceipt receipt={run.receipt} /></div>}
      <div className="mt-4"><TransactionTrace events={run.events} tx={run.tx} /></div>
      <footer className="mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-slate-500">The LLM never grades itself. This MVP verifies controlled React fixtures with selected axe rules, contrast math, computed styles and DOM measurements. Rollback restores browser state; it is not a git rollback or production CI integration.</footer>
    </div>
  </main>;
}
