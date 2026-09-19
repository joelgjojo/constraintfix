import type { FixtureState } from '@/transactions/change-set';
export function CheckoutForm({ state, onAction }: { state: FixtureState['checkout']; onAction: (message: string) => void }) {
  const associated = state !== 'visual-only';
  return <form className="fixture-content checkout-fixture" data-label-state={state} onSubmit={event => { event.preventDefault(); onAction('Checkout preview complete. No payment or network request was made.'); }}>
    <h3 className="text-lg font-semibold">Complete your workspace</h3>
    <p className="mt-2 text-xs text-slate-300">Pro plan · ₹999 / month</p>
    <label htmlFor={associated ? 'demo-checkout-email' : undefined} className="mt-6 block text-sm text-slate-200">Work email</label>
    <input id="demo-checkout-email" type="email" autoComplete="off" defaultValue="builder@example.test" className="mt-2 w-full min-w-0 rounded-xl border border-white/20 bg-[#101419] p-3 text-sm text-white" />
    <p className="mt-3 text-xs text-slate-400">{state === 'repaired' ? 'Email label restored for assistive technology.' : 'We will send your plan details to this address.'}</p>
    <button type="submit" data-contract-cta style={{ backgroundColor: '#60A5FA', color: '#0F172A' }} className="fixture-button">Preview checkout</button>
  </form>;
}
