# ConstraintFix

ConstraintFix is an **AI Change Firewall for coding agents**, built for **Track 04: Next-Gen Productivity & Automation**. It gives an agent a bounded repair surface, proves the rendered result against a visible contract, rejects unsafe work, rolls the UI back, and creates an exportable receipt.

It is intentionally a focused 60–90 second judge demo. The controlled `PricingCard` fixture makes the proof path repeatable; it does not import arbitrary repositories or execute model-written code.

## Run it

Use Node 20 or later.

```bash
npm install
npm run dev
```

The committed default is `VITE_AGENT_MODE=mock`: it makes **zero** model or network calls.

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

## Judge demo

1. Start at the visible **Constraint Contract**: WCAG AA with zero violations, protected `#60A5FA`, no horizontal overflow at 375px, and a clear autonomy policy.
2. Show the broken `PricingCard`: its information icon has no accessible name and the brand-blue CTA has poor white-text contrast.
3. Press **Start Repair**. ConstraintFix runs axe-core, WCAG contrast math, exact computed-brand equality, and live DOM overflow verification.
4. The policy-mapped safe repair adds `aria-label="Plan information"`. The semantic violation is fixed, while contrast remains below threshold.
5. In mock or replay mode, **Candidate A** darkens the CTA to `#2563EB`. Accessibility and 375px layout pass, but the protected brand token fails. The transaction rejects it and visibly rolls back.
6. At the conflict gate, choose **Preserve Brand**. The decision is limited to the actual product trade-off.
7. **Candidate B** keeps `#60A5FA` and changes CTA text to `#0F172A`. All deterministic checks pass and receipt **CF-018** appears. Export the JSON proof.

**Allow Change** is a real approved-exception path. It records the protected-token override and never calls it a brand pass.

In live mode, Codex may choose the foreground repair as its first candidate. If deterministic verification passes, ConstraintFix accepts it immediately instead of inventing the mock conflict.

## What is real

| Contract | Deterministic authority |
| --- | --- |
| WCAG AA, zero violations | axe-core button-name audit plus independent WCAG contrast calculation (minimum 4.5:1) |
| Protected brand `#60A5FA` | Exact computed-CSS equality against `rgb(96, 165, 250)` |
| Responsive at 375px | DOM geometry and horizontal-overflow checks inside the live preview |
| Autonomy | The semantic repair is automatic; protected-token changes and ambiguous trade-offs require a human choice |

The real executor maps only four known actions to fixture stages: add an accessible name, darken CTA, change CTA foreground, or do nothing. The model cannot inject CSS, execute code, mutate files, skip verification, or mark itself successful. `src/verification` is always the acceptance authority.

`RepairTransaction` and `ConstraintReceipt` record the initial audit, candidates, actual verifier snapshots, rollback, human choice, source trail, model-call count, timing, and final `3/3` constraint result.

## Agent architecture

```text
AgentProvider: MOCK | CODEX LIVE | CODEX REPLAY
                  ↓ validated structured candidate
Bounded fixture executor
                  ↓ browser render
axe-core · contrast math · token equality · DOM layout
                  ↓
accept · reject + rollback · request human choice
                  ↓
constraint receipt
```

`src/agent/types.ts` is the stable provider boundary. `src/agent/candidate-schema.ts` validates every structured candidate at runtime. `src/agent/provider.ts` chooses the mode, and `src/agent/fallback-agent.ts` sends a failed live request to replay.

The Vite server adapter at `server/codex-proxy.ts` creates a server-only `@openai/codex-sdk` thread in `read-only` sandbox mode with approvals and network disabled. A live transaction has at most two model turns: the initial proposal, then a **Preserve Brand** replan on the same thread with machine verification feedback. The browser receives no key, raw thread ID, or tool output.

Reusable shell controls stay in `src/components/ui`. The header uses the supplied ConstraintFix logo; `LiquidMetalButton` is the primary Start Repair CTA; `GradientButton` handles the human decision. The OGL Ferrofluid background uses `#000000`, `#080445`, and `#003cff`. The deliberately broken fixture remains isolated in `src/fixtures/pricing-card.tsx`.

## Modes and live setup

Set one mode in `.env.local`, then restart the development server.

```dotenv
# default: deterministic, zero model/network calls
VITE_AGENT_MODE=mock

# replay: zero model/network calls; reuses a validated live candidate captured
# in this browser session when one exists, otherwise uses the audited demo fixture
VITE_AGENT_MODE=replay

# live: calls the server-only Codex SDK after the user presses Start Repair
VITE_AGENT_MODE=live

# optional; do not prefix with VITE_. If absent, local Codex CLI auth is used.
CODEX_API_KEY=
```

Live requests are not retried automatically. A timeout, missing authentication, invalid schema, or unavailable SDK results in the visible **CODEX REPLAY** fallback. The fallback is deterministic and the verifier still runs normally. A successful live candidate is captured in `sessionStorage` only after client validation; replay never makes a network request.

The Codex SDK is installed as `@openai/codex-sdk`. Its documented server-side API uses `new Codex()`, `startThread()`, and repeated `thread.run()` calls to continue the same thread. This app constrains that capability to structured repair proposals and keeps final verification outside the model.
