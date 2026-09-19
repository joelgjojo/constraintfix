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

Live mode keeps the same judge-proof sequence: OpenAI produces a structured rationale for the policy-bounded contrast candidate, the browser rejects the protected-token change, and a Preserve Brand replan proposes the foreground repair. The model cannot skip the conflict or its deterministic verification.

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
AgentProvider: MOCK | OPENAI LIVE | OPENAI REPLAY
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

`api/codex/decision.js` is a Vercel Node function backed by the official OpenAI Responses API. It accepts only the two policy-approved planning stages, requests a strict JSON schema, enforces the expected mapped action, and returns no secret, prompt, or raw model output. It is stateless by design, so a deployment does not depend on a serverless function retaining memory between the candidate and replan requests. `server/codex-proxy.ts` mounts that same handler for local Vite development.

Reusable shell controls stay in `src/components/ui`. The header uses the supplied ConstraintFix logo; `LiquidMetalButton` is the primary Start Repair CTA; `GradientButton` handles the human decision; and `MagicBento` gives the otherwise static Contract and Agent Control panels bounded hover effects. The OGL Ferrofluid background uses `#000000`, `#080445`, and `#003cff`. The deliberately broken fixture remains isolated in `src/fixtures/pricing-card.tsx`; the bento wrapper never encloses it.

## Modes and local live setup

Set one mode in `.env.local`, then restart the development server.

```dotenv
# default: deterministic, zero model/network calls
VITE_AGENT_MODE=mock

# replay: zero model/network calls; reuses a validated live candidate captured
# in this browser session when one exists, otherwise uses the audited demo fixture
VITE_AGENT_MODE=replay

# live: calls the server-only OpenAI Responses API after Start Repair
VITE_AGENT_MODE=live

# required for live mode; do not prefix with VITE_.
OPENAI_API_KEY=

# optional; defaults to gpt-5-mini
OPENAI_MODEL=gpt-5-mini
```

Live requests are not retried automatically. A timeout, missing authentication, invalid schema, rate limit, or unavailable API results in the visible **OPENAI REPLAY** fallback. The fallback is deterministic and the verifier still runs normally. A successful live candidate is captured in `sessionStorage` only after client validation; replay never makes a network request.

## Deploy to Vercel

Vercel detects the Vite app and the `api/codex/decision.js` server function automatically. Import this repository, keep the repository root as the project root, and add these environment variables in **Project Settings → Environment Variables** for Production and Preview:

```dotenv
VITE_AGENT_MODE=live
OPENAI_API_KEY=your_server_only_key
# optional
OPENAI_MODEL=gpt-5-mini
```

Do not create a `VITE_OPENAI_API_KEY` variable: any variable with that prefix is included in the browser bundle. Deploy after the variables are saved. The browser header will show **OPENAI LIVE · replay fallback**. If the function is unavailable, the UI stays demo-safe by visibly switching to **OPENAI REPLAY** while deterministic verification continues.

The [OpenAI JavaScript quickstart](https://platform.openai.com/docs/quickstart/make-your-first-api-request) documents the server-side `OPENAI_API_KEY` convention. ConstraintFix calls the Responses API from its server function with `store: false`, strict JSON-schema output, a 25-second timeout, and no automatic retry. The API schema uses the Structured Outputs-compatible subset; the browser applies the full candidate validator before execution. The API key is read only by the server function; it is never sent to the browser.
