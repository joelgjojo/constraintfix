import type { FixtureState } from '@/transactions/change-set';
export function MobileHeader({ state, onAction }: { state: FixtureState['header']; onAction: (message: string) => void }) {
  const expanded = state === 'expanded';
  return <div className="fixture-content header-fixture" data-layout={state}>
    <header className="fixture-nav" style={{ minWidth: expanded ? 540 : 0 }}>
      <strong style={{ color: '#60A5FA' }}>Acme<span className="text-white"> / </span></strong>
      <nav aria-label="Demo product navigation" className="flex items-center gap-3">
        {expanded && <span className="whitespace-nowrap">Product · Resources · Enterprise</span>}
        <button type="button" onClick={() => onAction('Navigation preview: workspace selected.')}>Workspace</button>
        <button type="button" aria-label="Open navigation menu" onClick={() => onAction('Navigation preview: menu opened.')}>☰</button>
      </nav>
    </header>
    <div className="p-5"><p className="text-xs text-slate-300">Your workspace, wherever you build.</p><p className="mt-3 text-xs text-slate-400">{state === 'mobile-safe' ? 'Secondary navigation collapsed for mobile.' : 'Projects and account controls in one place.'}</p></div>
    <button type="button" data-contract-cta style={{ backgroundColor: '#60A5FA', color: '#0F172A' }} className="fixture-button" onClick={() => onAction('Workspace preview acknowledged locally.')}>Open workspace</button>
  </div>;
}
