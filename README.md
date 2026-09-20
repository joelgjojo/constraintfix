# ConstraintFix

**An agentic change-review and repair workflow for coding agents.** The AI Change Firewall, built with Codex for the Codex Community Hackathon — Calicut, Track 04: Next-Gen Productivity & Automation.

One request changes three real React fixtures. ConstraintFix applies their structured operations as one transaction, renders them, independently checks the result, rejects and rolls back the entire invalid change set, asks for brand policy, and verifies a replan before generating a receipt. **Agents propose. ConstraintFix proves.**

## The problem

Frontend coding agents can satisfy a local request while silently breaking an unrelated design-system token, mobile layout or accessibility requirement. This matters to development teams that use coding agents across products with persistent brand, accessibility and responsive constraints. A successful-looking component is insufficient evidence that a multi-file change is safe to land.

## What ConstraintFix does

ConstraintFix is an independent enforcement layer around an agent proposal. It validates the complete structured operation set, commits all three fixture states together, measures the rendered browser environment, and accepts the whole change set only when policy permits. A hard failure rejects every operation and restores the saved baseline; the agent cannot grade its own output.

## Run locally

Node 20+:

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

React + Vite + TypeScript + Tailwind v4, with reusable shadcn-style controls in `src/components/ui`. The supplied logo, blue/black Ferrofluid background, LiquidMetal Start Agent Run button, Gradient decision buttons and restrained MagicBento effects remain in the shell. The pricing fixture retains its isolated visual treatment.

The UI always starts in **BUNDLED REPLAY**, regardless of environment configuration. A clean clone needs no API key and makes zero model requests. The header also offers MOCK and an explicitly optional LIVE connector; the selector locks for the duration of a transaction.

## Workflow automated

Coding agents create multi-file frontend changes quickly. Developers still repeat the review afterward: inspect components, test accessibility, check design-system rules, check mobile behavior, identify regressions, revert unsafe changes, feed failures into another repair, re-test and document approval.

ConstraintFix automates that routine review loop. It escalates protected policy judgment to a person. The execution surface remains three controlled fixtures; the observations, rejection, state rollback and verification are real.

## Why this workflow is agentic

Each run has a goal and a derived operational plan. It invokes bounded tools, observes the rendered environment, decides acceptance from independent verifier results, acts by rejecting and restoring unsafe work, gathers structured feedback, escalates protected policy, requests a revised plan, executes that plan, verifies it and documents completion.

This is a constrained agentic workflow with a fixed operation vocabulary, not an open-ended autonomous coding agent. The default planner replays bundled decisions; it does not claim fresh AI reasoning. **Planner decisions replayed · tools and verification live.** Optional live planning uses the same executor and verifier.

The feedback loop distinguishes this from a test-only pipeline: it acts on failures, restores the baseline, obtains a specific human policy decision, sends the observations and that decision into replanning, executes the resulting validated operations and checks them again. It helps teams by automating those repeated actions and collecting their evidence. No time-saving multiplier has been measured or claimed.

## 90-second Track 04 pitch

| Time | Action and exact narrative |
| --- | --- |
| 0–12s | “Coding agents create frontend changes quickly. Developers still repeat the review afterward: inspect, test, catch regressions, revert, re-review and document. ConstraintFix turns that repetitive work into an agentic change-review workflow.” |
| 12–22s | Point to Agent Goal and the operational plan; press **Start Agent Run**. “Its goal is to make this three-file change safe under the organization’s contract. It handles routine steps automatically and asks only for policy judgment.” |
| 22–40s | Point to the tool trace and evidence. “The planner proposes; tools apply all three changes and measure the browser. Pricing is readable but changes the protected color. The header overflows. The form loses its accessible label. Six of nine gates pass, so the whole change is rejected.” |
| 40–50s | Point to rollback proof. “It automatically restores all three fixtures and re-runs verification. The baseline is back to nine out of nine. Nothing unsafe is partially accepted.” |
| 50–62s | Choose **Preserve Brand**. “Only this protected-brand decision needs a person. Keep our brand. The routine accessibility and responsive repairs remain the workflow’s responsibility.” |
| 62–76s | Show Replan Input and Revised Plan. “The actual verifier observations and my choice reach the planner together. It preserves the token, uses readable foreground text, repairs navigation and restores the form label. The tools execute again: nine out of nine.” |
| 76–90s | Show Automation Summary and receipt. “The run documents two candidates, one rejection, one rollback, one human escalation and a receipt. Bundled decisions are replayed; tools run live. ConstraintFix automates the review loop while teams control what is allowed to land.” |

Narration sets the pacing; the application does not add theatrical delays.

**Allow Change:** the same rejection and rollback lead to a pricing-brand waiver. Candidate B must still fix header overflow and form semantics. The result remains **8/9, approved exception**, with brand still FAIL.

## Multi-file change transaction

Each fixture renders inside a true 375px-wide verification surface, even on a narrow device (the preview wrapper can scroll independently).

| Fixture | Candidate A — actual browser behavior | Preserve Brand candidate B |
| --- | --- | --- |
| PricingCard.tsx | Computed CTA background `#2563EB`; white-text contrast ≈5.17:1 passes, protected `#60A5FA` fails; no overflow | `#60A5FA` + `#0F172A`, ≈7.02:1, brand and layout pass |
| MobileHeader.tsx | Expanded navigation measures 540px within 375px; layout fails | Secondary navigation collapses; scroll width375, layout passes |
| CheckoutForm.tsx | A visible label is detached from its input; axe `label` violation | Correct `htmlFor`/`id` association; zero selected-rule violations |

Before Candidate A, an automatic aria-label repair establishes an all-pass baseline. This baseline uses readable dark CTA text so rollback returns to an actually valid state. Candidate A deliberately proposes a different readable color treatment; it does not improve contrast over that baseline.

The 3×3 matrix groups semantics under Accessibility: axe `button-name` and `label`, plus independent CTA contrast math (≥4.5:1); exact computed brand equality on each CTA; and real DOM geometry/scroll measurements. Four policy areas therefore produce nine displayed gates, without double-counting semantics.

## Deterministic verification

Providers return bounded operations and explanations. They do not return verifier outcomes. Acceptance is derived from live `axe-core` results, computed CTA styles, independent WCAG contrast math, and DOM geometry inside three actual 375px surfaces. The UI exposes the measured contrast, expected/actual brand color, container/scroll widths, axe rule, impact and affected-node count beneath the matrix.

## Policy-as-code contract

`src/constraints/contract.ts` is the single policy source for the contrast threshold, selected axe violation limit, protected brand token, verification viewport, overflow rule and autonomy modes. Every transaction deep-clones that `ConstraintContract` when it starts. The verification surfaces and deterministic verifier then consume the same transaction snapshot, so a later global policy change cannot alter an in-flight decision.

Agent providers can propose only validated operations; they cannot change the contract or set verifier truth. Receipt v4 records the exact contract snapshot plus an explicit `gateResult` with its decision, passed/required/failed checks, approved-exception count and recommended exit code. This is machine-readable, CI-ready decision output. Connecting it to a real CI system remains future work, and the hackathon executor remains intentionally bounded to the three controlled fixtures.

## Architecture

```text
AgentProvider (BUNDLED REPLAY / MOCK / OPTIONAL LIVE)
  → validated structured operations for three fixtures
  → deterministic executor, one React state commit
  → actual browser render
  → axe + contrast math + computed token + DOM geometry
  → whole-change-set acceptance OR rejection + snapshot rollback
  → baseline re-verification → human policy → multi-file replan
  → verification → receipt v4 with contract + gateResult
```

- `src/constraints/contract.ts`: typed policy source snapshotted into every transaction and receipt.
- `src/transactions/change-set.ts`: explicit ChangeSet, operations, transaction, acceptance policy, rollback and receipt aggregation.
- `src/transactions/use-change-transaction.ts`: phase flow, operation locks, atomic render, audits, recovery, human decisions and reset.
- `src/fixtures`: PricingCard, MobileHeader and CheckoutForm; local preview actions never navigate or charge.
- `src/verification/change-set.ts`: serial axe audits and measured per-fixture results. Providers cannot set PASS/FAIL.
- `src/components/verification-matrix.tsx`: results and inspectable browser evidence.
- `src/components/change-set-report.tsx`: honest operation descriptions, trace and downloadable receipt.
- `src/agent/types.ts`: stable provider boundary and truthful runtime source values.

Only allowlisted fixture/action combinations can execute. A malformed, partial, duplicated or out-of-policy operation set is rejected before any fixture changes. Reset clears candidates, receipt, matrix, events, user input and preview feedback. Synchronous operation locks block overlapping work. Unexpected render/audit/provider failures recover to the saved baseline when available and cannot produce an accepted receipt.

Receipt schema v4 includes transaction/change-set IDs, request, source, contract snapshot, machine-readable gate result, files, candidate operations and measured outcomes, all five audits, restored state/proof, human policy, exceptions, final outcome and evaluation. A normal run has **2 attempts, 3 files, 18 candidate checks, 45 total measured checks** (including initial, baseline and rollback audits), 1 rejection, 1 rollback and 1 human decision.

## AgentRun and executed tools

`ChangeTransaction.agentRun` composes around the existing transaction. The transaction remains the authority for status, candidates, audit matrices, contract and rollback. AgentRun adds the goal, derived plan, ordered execution trace, human escalations and exact replan input/output. Receipt v4 contains the completed run trace.

The trace wraps the real calls in `use-change-transaction.ts`; a tool is marked succeeded only after its operation returns, and thrown errors are marked failed:

| Tool | Actual behavior |
| --- | --- |
| inspect_change_set | Checks all three rendered fixture targets and reads the transaction contract |
| repair_accessible_name | Renders the pricing aria-label repair |
| plan_change_set | Calls the selected AgentProvider with measured feedback |
| apply_change_set | Validates operations, updates React state atomically and confirms render |
| verify_change_set | Runs serial axe audits, computed-color contrast, brand comparison and DOM geometry for all fixtures |
| rollback_transaction | Restores the saved fixture-state snapshot and renders it |
| verify_rollback | Re-runs the same real browser verifier after restoration |
| request_human_policy | Requires verified rollback and an observed brand failure; records exactly one escalation |
| generate_constraint_receipt | Builds a receipt only after accepted or approved-exception verification |

Verification is one combined tool because that is the actual existing function boundary. It runs all three verifier categories; there are no decorative separate calls.

The same `AgentDecisionInput` object retained in Replan Input is sent to the provider. It includes the complete matrix, structured per-fixture observations (actual/expected brand, contrast/threshold, viewport/scroll width and axe violations), and the human choice. The live handler forwards those observations to its planner prompt too. Replayed operation choices remain bounded; changing the contract does not make this a general repair engine.

Automation Summary derives files reviewed from actual audits, candidate-check counts from candidate matrices, and rejection, rollback and escalation counts from the run. “0 automated checks pending” means every selected gate was measured, not that no manual review is ever needed. Approved exceptions remain measured failures.

## Agent and Codex role

Codex was used during development to inspect the original scaffold, implement and refactor the transaction/verifier/component boundaries, write focused tests and documentation, and perform repeated browser QA. That development provenance is separate from runtime mode.

The guaranteed judge run uses a **bundled audited proposal**. It demonstrates the full agent loop without claiming fresh model reasoning and without an external dependency. MOCK is another deterministic offline planner. The optional live connector can request a fresh structured proposal, but deterministic verification remains authoritative in every mode.

### Why not just ask Codex to check its own change?

Codex is the change generator; ConstraintFix is the independent enforcement layer. A coding agent can propose or replan, but it cannot decide whether its own work passes persistent organizational constraints. ConstraintFix measures the rendered environment and can reject and roll back the entire transaction.

## Optional experimental live connector

`api/codex/decision.js` is a standalone Vercel Node function using the OpenAI Responses API. `server/codex-proxy.ts` mounts the same handler in Vite development. Set server-only variables in `.env.local` or Vercel Project Settings → Environment Variables:

```dotenv
OPENAI_API_KEY=your_server_only_key
# optional
OPENAI_MODEL=gpt-5-mini
```

Never prefix a secret with `VITE_`. Vercel uses the Vite build output plus the API function. Redeploy after changing environment variables. `npm run preview` tests static production output; local live calls require `npm run dev` or the deployed Vercel function.

For local live requests, also set `VITE_AGENT_MODE=live` so the development proxy is registered, then restart `npm run dev`. Select **OPTIONAL LIVE PLANNER** explicitly before Start Agent Run. Live requests carry the real per-fixture feedback and human policy, request strict structured output and validate all three operations at both the API boundary and executor. No arbitrary model-written code runs. Calls use `store:false`, a 25-second timeout and no automatic retry.

Failed live planning switches visibly to **BUNDLED REPLAY**, while deterministic verification still runs. The fallback is an audited offline proposal, not a captured OpenAI response and not fresh model reasoning.

**This upgrade was tested without paid model calls.** The multi-file live schema and local validation are implemented; a real three-file LIVE end-to-end run remains untested in this upgrade. BUNDLED REPLAY is the submission mode.

## What is real and what is bounded

Current and real: controlled React fixtures, allowlisted operations, browser rendering, axe checks, computed styles, contrast math, DOM geometry, atomic React-state rollback, a human policy gate, and receipt/evaluation aggregation.

Bounded by design: Candidate A and B use the scenario's validated operation allowlist. Rollback restores React fixture state, not git commits. Verification covers selected axe rules, action-surface contrast/token equality and 375px overflow; it is not full WCAG compliance, arbitrary repository analysis, a real PR integration or universal frontend safety.

## Tests

`npm test` covers provider contracts plus multi-fixture operation validation, every atomic rejection gate, rollback isolation, receipt aggregation, the restricted exception path, mutable policy comparisons, transaction contract isolation and network-free MOCK/BUNDLED REPLAY. Browser repeatability and production-preview findings are recorded in `docs/upgrade-validation.md`.

The submission also runs `npm run typecheck`, `npm run build`, a production preview, a clean-clone install, and repeated Preserve Brand / Allow Change browser runs.

## Judge FAQ

**Is this hardcoded?** The scenario is intentionally bounded to validated structured operations for the hackathon MVP. The DOM, axe, computed style, contrast and geometry measurements are real and determine acceptance.

**Why not just ask Codex?** The coding agent proposes changes; ConstraintFix independently enforces persistent constraints and can reject the whole transaction.

**Is rollback a git rollback?** No. The current MVP atomically restores an application-state snapshot across the three controlled fixtures and re-measures it.

**Does it support arbitrary repositories?** Not yet. Provider, executor and verifier boundaries are isolated for a future repository adapter.

**What part uses AI?** Proposal and replanning are provider-driven or bundled depending on the selected mode. Verification is deliberately deterministic.

**How was Codex used?** Codex helped inspect, implement, refactor, test, document and browser-verify the project during development. The default runtime does not claim a fresh Codex/OpenAI call.

## Current limitations

The MVP has three controlled frontend fixtures and a fixed operation vocabulary. It does not ingest repositories, execute arbitrary patches, roll back git, gate pull requests, certify complete WCAG compliance or generalize its checks to every framework. The optional live connector is isolated and is not needed for the submitted demo.

## Future direction

A GitHub/CI adapter could turn repository diffs into bounded change transactions, and a contract loader could select organization-specific policy snapshots. Those adapters are future work; they are not represented as current functionality.
