# ConstraintFix

ConstraintFix is a judge-ready **Track 04: Next-Gen Productivity & Automation** demo. It shows a frontend-repair agent that can make a safe fix, verify a rendered result, stop at a real product conflict, ask for the one human decision that matters, replan, and prove the final interface.

## Run the demo

Use Node 20 or later.

```bash
npm install
npm run dev
```

Open the local URL Vite prints. The default configuration uses the deterministic demo reasoner, which is the recommended mode for judging.

```bash
npm run typecheck
npm run build
npm run preview
```

`npm run preview` verifies the production bundle. It also preserves the demo because the mock reasoner is built into the app by default.

## Judge sequence (60–90 seconds)

1. Point out the broken `PricingCard`: the information icon has no accessible name, and the brand-blue CTA has insufficient white-text contrast.
2. Press **Start Repair**. ConstraintFix runs axe-core, WCAG contrast math, protected-token equality, and DOM overflow checks against the rendered interface.
3. The agent autonomously adds `aria-label="Plan information"`, then re-verifies. The contrast failure remains.
4. It changes the CTA background from `#60A5FA` to `#2563EB`. Accessibility passes, but the protected-brand check fails.
5. The agent stops at **Human decision required**. Choose **Preserve Brand**.
6. The replan restores `#60A5FA` and changes CTA foreground text to `#0F172A` instead. The final card shows accessibility, brand, and layout as **PASS**.

The alternate **Allow Change** path deliberately records a human-approved brand exception instead of silently treating it as a pass.

## Architecture

```text
AgentProvider (OpenAI or mock)
        ↓ structured repair decision
Deterministic executor
        ↓ React render
axe-core + contrast + protected token + DOM geometry
        ↓
verified result, conflict, or human gate
```

`src/agent/types.ts` is the contract. The application only depends on `AgentProvider`; it does not depend on a model SDK. `src/agent/provider.ts` selects the provider, and `src/agent/fallback-agent.ts` keeps the demo moving if the decision service cannot respond.

Reusable app-shell controls live in `src/components/ui`: `LiquidMetalButton` is the primary Start Repair CTA and `GradientButton` is used for the human decision controls. The deliberately broken fixture remains isolated at `src/fixtures/pricing-card.tsx`.

## What is real

- React, Vite, TypeScript, Tailwind CSS v4, and shadcn-style aliases
- A rendered-browser axe-core audit for the `button-name` semantic repair
- Independent WCAG contrast-ratio calculation for the repaired CTA
- Exact protected-token check for `#60A5FA`
- DOM geometry and horizontal-overflow verification inside the real 375px preview viewport
- The state machine: `IDLE → AUDITING → PLANNING → PATCHING → RENDERING → VERIFYING → WAITING_FOR_HUMAN → REPLANNING → COMPLETE` (or `FAILED`)
- A production build and static preview path

## Optional OpenAI decision layer

The real provider is implemented, but it is optional so the judge flow stays reliable without network access. It uses the Responses API with Structured Outputs. The API key is read only by the local Vite server route at `server/openai-proxy.ts`; it is never sent to the browser and `.env.local` is ignored by Git.

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

```dotenv
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5-mini
VITE_AGENT_PROVIDER=openai
```

Then restart `npm run dev`. `gpt-5-mini` supports the Responses API and Structured Outputs, and is a practical choice for this narrowly scoped decision task. The server validates every model decision against the permitted demo action for the current stage. The model proposes the structured decision and reason; it never performs the patch or marks verification as successful.

If the network, key, API, or response contract fails, the browser switches to the local mock provider and adds a visible **Demo-safe fallback engaged** timeline event. For a deployed production application, move the same route into the chosen server or serverless runtime; a static Vite host cannot hold a server-side API secret.

Official OpenAI references: [Responses API](https://developers.openai.com/api/reference/cli/resources/responses/methods/create) and [GPT-5 Mini](https://developers.openai.com/api/docs/models/gpt-5-mini).
