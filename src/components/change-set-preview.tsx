import { useRef, useState, type CSSProperties, type RefObject } from 'react';
import { PricingCard } from '@/fixtures/pricing-card';
import { MobileHeader } from '@/fixtures/mobile-header';
import { CheckoutForm } from '@/fixtures/checkout-form';
import { files, type FixtureState } from '@/transactions/change-set';
import type { ConstraintContract } from '@/constraints/contract';
export function ChangeSetPreview({ state, rootRef, label, resetKey, contract }: { state: FixtureState; rootRef: RefObject<HTMLDivElement>; label: string; resetKey: string; contract: ConstraintContract }) {
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [notice, setNotice] = useState('');
  return <section aria-label="Rendered change set" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="section-kicker">RENDERED PRODUCT · 3 REAL REACT FIXTURES</div><h2 className="mt-2 text-lg font-semibold">{label}</h2></div><span className="text-xs text-slate-400">{contract.responsive.viewportWidth}px each · local preview actions</span></div>
    <div ref={rootRef} data-testid="fixture-set" data-render-state={JSON.stringify(state)} data-contract-version={contract.version} className="fixture-grid" style={{ '--verification-width': `${contract.responsive.viewportWidth}px` } as CSSProperties}>
      {files.map(file => <article key={file.id} className="panel min-w-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10"><h3 className="font-mono text-xs text-slate-300">{file.name}</h3></div>
        <div className="fixture-viewport-scroll"><div data-verifier={file.id} className="verification-surface"><div data-fixture-content key={`${file.id}-${resetKey}`}>
          {file.id === 'pricing-card' ? <PricingCard stage={state.pricing} readableBaseline ctaRef={ctaRef} onPreviewAction={setNotice} /> : file.id === 'mobile-header' ? <MobileHeader state={state.header} onAction={setNotice} /> : <CheckoutForm state={state.checkout} onAction={setNotice} />}
        </div></div></div>
      </article>)}
    </div>
    {notice && <p role="status" className="text-xs text-sky-200">{notice}</p>}
  </section>;
}
