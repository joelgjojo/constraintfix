# ConstraintFix

ConstraintFix is an **AI Change Firewall for coding agents**, built for **Track 04: Next-Gen Productivity & Automation**. Coding agents can propose a frontend change; ConstraintFix renders it in a controlled browser surface, verifies a visible contract, rejects unsafe work, rolls back automatically, and produces an exportable receipt before anyone has to trust it.

The app is a focused 60–90 second demo, not a general-purpose code import tool. Its controlled `PricingCard` fixture makes the entire proof path repeatable.

## Run it

Use Node 20 or later.

```bash
npm install
npm run dev
```

The default `VITE_AGENT_MODE=mock` makes no network requests and spends no API credits.

```bash
npm run typecheck
npm run build
npm run preview
```

## Judge demo sequence

1. Start with the visible **Constraint Contract**: WCAG AA with zero violations, protected `#60A5FA`, no horizontal overflow at 375px, and a clear autonomy policy.
2. Point to the broken `PricingCard`: its information icon has no accessible name and the brand-blue CTA has insufficient white-text contrast.
3. Press **Start Repair**. ConstraintFix runs axe-core, WCAG contrast math, exact brand-token equality, and DOM overflow verification against the rendered card.
4. The agent autonomously applies the low-risk `aria-label="Plan information"` repair. Verification proves the semantic issue is fixed, but contrast still fails.
5. **Candidate A** darkens the CTA to `#2563EB`. Accessibility and 375px layout pass, but the protected brand token fails. The transaction is visibly rejected and the UI automatically rolls back to the last valid render.
6. At the **Constraint Conflict** gate, choose **Preserve Brand**. The human choice is limited to the actual trade-off.
7. **Candidate B** keeps `#60A5FA` and changes CTA text to `#0F172A`. All deterministic checks pass, the transaction is accepted, and receipt **CF-018** appears. Use **Export JSON** to download its evidence.

The alternate **Allow Change** path deliberately creates an approved brand exception. It never calls a protected-token failure a pass.

## What is enforced

`src/transactions/types.ts` defines the strongly typed transaction model. `src/transactions/contract.ts` provides the contract and converts browser results into immutable verifier snapshots.

| Contract | Deterministic verifier |
| --- | --- |
| WCAG AA, zero violations | `axe-core` button-name audit and independent contrast-ratio calculation (minimum 4.5:1) |
| Brand `#60A5FA` protected | Exact computed CSS color equality against `rgb(96, 165, 250)` |
| Responsive at 375px | DOM geometry and horizontal-overflow checks inside the live preview |
| Autonomy | Low-risk semantic patch is automatic; protected-token changes and ambiguous trade-offs require a human choice |

`RepairTransaction` tracks the run, Candidate A and Candidate B, verifier evidence, automatic rollback, and the human decision. A successful run creates `ConstraintReceipt` **CF-018** with the source, original violations, full candidate history, final verification, rollback count, and intervention record. The receipt is locally exportable as JSON.

## What is AI-driven and what is real

The provider may propose a brief, structured next action and a reason. It cannot mutate the UI, skip a gate, mark verification successful, or overwrite a protected constraint. The real implementation is the browser-rendered executor, axe-core audit, contrast math, brand equality, layout verifier, state-based rollback, transaction history, and receipt generator.

```text
AgentProvider (mock or optional OpenAI)
        ↓ structured proposal
Bounded demo executor
        ↓ browser render
Deterministic verifier suite
        ↓
accept · reject and rollback · ask human
        ↓
constraint receipt
```

The main app depends only on the `AgentProvider` interface in `src/agent/types.ts`. `src/agent/provider.ts` selects the configured provider, and `src/agent/fallback-agent.ts` falls back to the deterministic mock if the optional decision service is unavailable.

Reusable app-shell controls are under `src/components/ui`. The primary Start Repair CTA uses `LiquidMetalButton`; the human decision uses `GradientButton`. The supplied ConstraintFix logo appears in the header. The OGL Ferrofluid canvas uses the requested `#000000`, `#080445`, and `#003cff` palette across the complete background. The deliberately broken fixture remains isolated at `src/fixtures/pricing-card.tsx`.

## Optional OpenAI provider

Mock mode is the recommended judge setting. It is deterministic and requires no credentials.

The optional OpenAI provider is ready for a local development session. Its Responses API call runs only in the Vite server middleware at `server/openai-proxy.ts`; the browser only calls `/api/agent/decision`, and the API key never receives a `VITE_` prefix. In mock or replay mode, that route is not registered at all.

```bash
cp .env.example .env.local
```

Set the following in `.env.local`, then restart the development server:

```dotenv
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5-mini
VITE_AGENT_MODE=live
```

Live mode uses structured decisions and validates every response against the fixed demo action contract. If the endpoint, API key, network, or structured response fails, it visibly switches to the local mock provider and continues the demo safely. `VITE_AGENT_PROVIDER=openai` remains supported for existing local configurations, but `VITE_AGENT_MODE=live` is the preferred activation path.
