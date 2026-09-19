# ConstraintFix

**AI Change Firewall for coding agents** — Track 04: Next-Gen Productivity & Automation.

One request changes three real React fixtures. ConstraintFix applies their structured operations as one transaction, renders them, independently checks the result, rejects and rolls back the entire invalid change set, asks for brand policy, and verifies a replan before generating a receipt. **The LLM never grades itself.**

## Setup

Node 20+:

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

React + Vite + TypeScript + Tailwind v4, with reusable shadcn-style controls in `src/components/ui`. The supplied logo, blue/black Ferrofluid background, LiquidMetal Start Repair button, Gradient decision buttons and restrained MagicBento effects remain in the shell. The pricing fixture retains its isolated visual treatment.

The UI always starts in **MOCK**, regardless of environment configuration. Select MOCK, REPLAY or LIVE in the header before a run. The selector locks until reset. MOCK and REPLAY require no API key and make zero model requests.

## 60–90 second judge flow

| Time | Action and narrative |
| --- | --- |
| 0–12s | “An AI coding agent proposes a three-file checkout redesign. This organization has persistent accessibility, brand, mobile and semantic requirements.” Point to the request and contract. |
| 12–22s | Press **Start Repair**. “We first fix the unnamed info button safely, establish a verified baseline, then apply all three candidate operations as one transaction.” |
| 22–40s | Show the **6/9 REJECTED** matrix. “The pricing CTA is readable but violates the protected blue. The header actually overflows at 375px. The checkout input loses its accessible label.” Expand browser evidence if useful. |
| 40–50s | Point to rollback proof: **3 fixtures restored, baseline 9/9**. “Any failed gate rejects the entire change set. This is atomic enforcement.” |
| 50–65s | Choose **Preserve Brand**. “Product judgment sets the policy; the agent replans all three files using measured feedback.” |
| 65–80s | Show **9/9 VERIFIED** and receipt. “Two attempts, 18 candidate checks, one rejected candidate, one rollback, one human decision. Exportable evidence explains why this change can land.” Press **Export JSON**. |
| 80–90s | Reset for the next judge. “Models propose. Deterministic checks decide.” |

Automatic transitions take seconds; narration and the human gate set the demo pace. There is no forced minute-long wait.

**Allow Change:** after the same rejection and rollback, permit only the pricing brand exception. Candidate B still fixes header overflow and form semantics. The final result is **8/9, approved exception**, with brand still FAIL. It never masquerades as a fully verified 9/9 result.

## Real browser proof

Each fixture renders inside a true 375px-wide verification surface, even on a narrow device (the preview wrapper can scroll independently).

| Fixture | Candidate A — actual browser behavior | Preserve Brand candidate B |
| --- | --- | --- |
| PricingCard.tsx | Computed CTA background `#2563EB`; white-text contrast ≈5.17:1 passes, protected `#60A5FA` fails; no overflow | `#60A5FA` + `#0F172A`, ≈7.02:1, brand and layout pass |
| MobileHeader.tsx | Expanded navigation measures 540px within 375px; layout fails | Secondary navigation collapses; scroll width375, layout passes |
| CheckoutForm.tsx | A visible label is detached from its input; axe `label` violation | Correct `htmlFor`/`id` association; zero selected-rule violations |

Before Candidate A, an automatic aria-label repair establishes an all-pass baseline. This baseline uses readable dark CTA text so rollback returns to an actually valid state. Candidate A deliberately proposes a different readable color treatment; it does not improve contrast over that baseline.

The 3×3 matrix groups semantics under Accessibility: axe `button-name` and `label`, plus independent CTA contrast math (≥4.5:1); exact computed brand equality on each CTA; and real DOM geometry/scroll measurements. Four policy areas therefore produce nine displayed gates, without double-counting semantics.

## Architecture

```text
AgentProvider (MOCK / REPLAY / LIVE)
  → validated structured operations for three fixtures
  → deterministic executor, one React state commit
  → actual browser render
  → axe + contrast math + computed token + DOM geometry
  → whole-change-set acceptance OR rejection + snapshot rollback
  → baseline re-verification → human policy → multi-file replan
  → verification → receipt v2
```

- `src/transactions/change-set.ts`: explicit ChangeSet, operations, transaction, acceptance policy, rollback and receipt aggregation.
- `src/transactions/use-change-transaction.ts`: phase flow, operation locks, atomic render, audits, recovery, human decisions and reset.
- `src/fixtures`: PricingCard, MobileHeader and CheckoutForm; local preview actions never navigate or charge.
- `src/verification/change-set.ts`: serial axe audits and measured per-fixture results. Providers cannot set PASS/FAIL.
- `src/components/verification-matrix.tsx`: results and inspectable browser evidence.
- `src/components/change-set-report.tsx`: honest operation descriptions, trace and downloadable receipt.
- `src/agent/types.ts`: AgentProvider boundary; legacy single-fixture modules remain for compatibility.

Only allowlisted fixture/action combinations can execute. A malformed, partial, duplicated or out-of-policy operation set is rejected before any fixture changes. Reset clears candidates, receipt, matrix, events, user input and preview feedback. Synchronous operation locks block overlapping work. Unexpected render/audit/provider failures recover to the saved baseline when available and cannot produce an accepted receipt.

Receipt schema v2 includes transaction/change-set IDs, request, source, files, candidate operations and measured outcomes, all five audits, restored state/proof, human policy, exceptions, final outcome and evaluation. A normal run has **2 attempts, 3 files, 18 candidate checks, 45 total measured checks** (including initial, baseline and rollback audits), 1 rejection, 1 rollback and 1 human decision.

## OpenAI and deployment

`api/codex/decision.js` is a standalone Vercel Node function using the OpenAI Responses API. `server/codex-proxy.ts` mounts the same handler in Vite development. Set server-only variables in `.env.local` or Vercel Project Settings → Environment Variables:

```dotenv
OPENAI_API_KEY=your_server_only_key
# optional
OPENAI_MODEL=gpt-5-mini
```

Never prefix a secret with `VITE_`. Vercel uses the Vite build output plus the API function. Redeploy after changing environment variables. `npm run preview` tests static production output; local live calls require `npm run dev` or the deployed Vercel function.

Select **LIVE · uses API credits** explicitly before Start Repair. Live requests carry the real per-fixture feedback and human policy, request strict structured output and validate all three operations both at the boundary and executor. No arbitrary model-written code runs. The model can explain and propose only within the controlled scenario's stage-specific allowlist. Calls use `store:false`, a 25-second timeout and no automatic retry.

Failed live planning switches visibly to REPLAY, while deterministic verification still runs. The multi-file REPLAY mode uses the bundled audited proposal and replan; legacy single-fixture replay also supports a validated session-captured response. These are offline demo decisions, not claims of fresh live model reasoning.

**This upgrade was tested without paid model calls.** The multi-file live schema and local validation are implemented; a real three-file LIVE end-to-end run remains intentionally untested. MOCK and REPLAY are the judge-ready paths.

## Scope and validation

This is a controlled browser-rendered MVP. Rollback restores React fixture state, not git commits. Verification covers selected axe rules, action-surface contrast/token equality and 375px overflow; it is not full WCAG compliance, arbitrary repository analysis, a real PR integration or universal frontend safety.

`npm test` covers existing contracts plus multi-fixture operation validation, every atomic rejection gate, rollback isolation, receipt aggregation, the restricted exception path and network-free MOCK/REPLAY. Browser repeatability and production-preview findings are recorded in `docs/upgrade-validation.md`.
