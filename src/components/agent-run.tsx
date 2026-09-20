import { agentGoal, operationalPlan, automationSummary } from '@/agent/run';
import type { ChangeTransaction } from '@/transactions/change-set';

export function AgentPlan({ tx }: { tx: ChangeTransaction | null }) {
  return <section className="panel my-4 p-5" aria-label="Agent goal and plan">
    <div className="section-kicker">AGENT GOAL</div>
    <h2 className="mt-2 text-base font-medium">{tx?.agentRun.goal ?? agentGoal}</h2>
    <details className="mt-3 text-xs text-slate-400" open>
      <summary className="cursor-pointer text-sky-200">Operational plan · derived from the bounded workflow</summary>
      <ol className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2 list-decimal pl-4">{(tx?.agentRun.plan ?? operationalPlan).map(step => <li key={step}>{step}</li>)}</ol>
    </details>
  </section>;
}

const revisedActions = {
  darken_cta: 'Pricing: keep the proposed darker CTA under the explicit brand exception',
  change_text_color: 'Pricing: restore the protected blue and use readable dark foreground text',
  mobile_safe_navigation: 'Header: collapse secondary navigation for mobile',
  associate_label: 'Form: restore the email label association',
  expanded_navigation: 'Header: expand navigation',
  compact_field: 'Form: use a compact field',
};

export function AgentTrace({ tx }: { tx: ChangeTransaction | null }) {
  const replan = tx?.agentRun.replan;
  return <section className="panel p-5" aria-label="Agent run">
    <div className="flex justify-between gap-2"><h2 className="section-kicker">AGENT RUN · AUTOMATION TRACE</h2><span className="text-xs text-slate-400">{tx?.status.replaceAll('_', ' ') ?? 'Ready'}</span></div>
    <p className="mt-2 text-xs text-slate-400">Automate the routine. Escalate the judgment.</p>
    {tx && <p className="mt-3 border-l-2 border-sky-400/50 pl-3 text-xs text-sky-200" aria-live="polite">Latest: {tx.agentRun.trace.at(-1)?.title}</p>}
    {replan && <section className="mt-4 rounded-xl border border-sky-400/20 bg-sky-400/5 p-3" aria-label="Replan feedback">
      <div className="section-kicker">REPLAN INPUT</div><p className="mt-2 text-xs text-slate-300">Verifier failures: {replan.input.changeSet?.observations?.failedChecks} · Human policy: {replan.input.humanChoice?.replaceAll('_', ' ')}</p>
      <div className="section-kicker mt-3">REVISED PLAN · {replan.source?.replaceAll('_', ' ') ?? 'Awaiting planner'}</div>
      <ul className="mt-2 space-y-2 text-xs text-sky-100">{replan.operations?.map(op => <li key={op.fixture}>{revisedActions[op.action]}</li>)}</ul>
      <details className="mt-3 text-xs text-slate-400"><summary className="cursor-pointer">Exact observations sent to planner</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[10px]">{JSON.stringify(replan.input.changeSet?.observations, null, 2)}</pre></details>
    </section>}
    <ol className="mt-4 max-h-[460px] overflow-y-auto space-y-3" aria-label="Executed agent operations">
      {!tx && <li className="text-xs text-slate-400">Start an agent run to see executed tools and measured observations.</li>}
      {tx?.agentRun.trace.map(entry => <li key={entry.id} className="border-l border-white/15 pl-3">
        <div className="text-[10px] uppercase tracking-wider text-sky-300">{entry.kind} {entry.status && `· ${entry.status}`}</div>
        <p className="mt-1 text-xs font-semibold text-slate-200">{entry.title}</p><p className="mt-1 text-[11px] leading-5 text-slate-400">{entry.detail}</p>
        {entry.observation && <details className="mt-1 text-[11px] text-slate-400"><summary className="cursor-pointer">Measured evidence</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[10px]">{JSON.stringify(entry.observation, null, 2)}</pre></details>}
      </li>)}
    </ol>
  </section>;
}

export function AutomationSummary({ tx, receiptGenerated }: { tx: ChangeTransaction; receiptGenerated: boolean }) {
  const summary = automationSummary(tx, receiptGenerated);
  const metrics = [
    ['Files reviewed', summary.filesReviewed], ['Candidate checks', summary.candidateChecks],
    ['Unsafe candidates rejected', summary.rejectedCandidates], ['Automatic rollbacks', summary.rollbacks],
    ['Human escalations', summary.escalations], ['Automated checks pending', summary.pendingChecks ?? 'In progress'],
    ['Receipt', summary.receiptGenerated ? 'Generated' : 'Pending'],
  ];
  return <section className="panel my-4 p-5" aria-label="Automation summary"><div className="section-kicker">AUTOMATION SUMMARY · FRONTEND CHANGE REVIEW</div>
    <p className="mt-2 text-xs text-slate-400">Inspect → verify → reject → rollback → replan → re-verify → document. Human involvement: policy judgment.</p>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{metrics.map(([label, value]) => <div className="metric-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <p className="mt-3 text-xs text-slate-400">{summary.failedChecks ? `${summary.failedChecks} measured gate remains failed; see the recorded exception. ` : ''}These are executed checks, not a claim that all manual review is unnecessary.</p>
  </section>;
}
