# Multi-file upgrade validation — 20 September 2026

## Architecture and files

The default application now runs a three-fixture ChangeSet through a transaction hook. Existing AgentProvider, fallback, operation gate, UI controls and legacy transaction tests are retained. Operations are validated as one set before a single React state commit. Browser checks determine acceptance; a failed candidate restores the saved valid snapshot for all three fixtures and re-verifies it before the policy gate.

Added: `src/transactions/change-set.ts`, `use-change-transaction.ts`; `src/fixtures/mobile-header.tsx`, `checkout-form.tsx`; `src/verification/change-set.ts`; `src/components/change-set-preview.tsx`, `verification-matrix.tsx`, `change-set-report.tsx`; `tests/change-set.test.ts`.

Updated: App composition, pricing baseline option, decision copy, shell CSS, accessibility rules, provider/types/mock/replay/live adapters, Vercel multi-file schema, test command, TypeScript project inclusion and README.

## Actual browser evidence

Production build served at http://127.0.0.1:4182/.

| Fixture | Candidate A | Rollback | Preserve Brand candidate B |
| --- | --- | --- | --- |
| Pricing | Contrast5.1686 passes; computed rgb(37,99,235) fails protected token; layout375 passes | Named icon; rgb(96,165,250); contrast7.0219; layout375 | Contrast7.0219, protected token, semantics and layout pass |
| Header | Real scrollWidth540 within width375; accessibility and brand pass | scrollWidth375; named controls; protected CTA | scrollWidth375, all gates pass |
| Form | axe `label` critical violation, one node; brand/layout pass | Associated label restored; no selected violations | Associated label; all gates pass |

Candidate A: **6/9, whole change set rejected**. Rollback: **3 states restored, 9/9 re-verified**. Preserve: **9/9 accepted**. Allow: **8/9 approved exception**, exclusively Pricing brand FAIL; header and form repaired. Matrix cells use actual verifier results; history is explicitly labeled when current fixtures already show the restored baseline.

## Seven repeated end-to-end runs

Reset between runs; run2 reloaded the latest production build after copy edits. All audits include initial, baseline, candidate A, rollback and candidate B. Each receipt contains two attempts, three files, 18 candidate checks, 45 total measured checks, one rejection, one rollback, three restored fixtures, one human decision and zero model calls.

| Receipt | Mode | Choice | Final |
| --- | --- | --- | --- |
| CF-50bd698c | MOCK | Preserve Brand | 9/9 accepted |
| CF-ee8fc1db | MOCK | Preserve Brand | 9/9 accepted |
| CF-32a676e5 | MOCK | Preserve Brand | 9/9 accepted |
| CF-612f4717 | REPLAY | Preserve Brand | 9/9 accepted |
| CF-bc8f5aab | REPLAY | Preserve Brand | 9/9 accepted |
| CF-ce544778 | REPLAY | Allow Change | 8/9 approved exception |
| CF-b3bf855d | MOCK | Allow Change | 8/9 approved exception |

No duplicate receipt was present. Reset returned the application to idle, removed prior evidence/receipt, restored the unnamed pricing info button and original fixtures. Input and local feedback reset were checked separately. Start/Reset/mode locks were observed during work. Restart demo at the policy gate was checked separately. Export JSON activated and changed to JSON exported. Fixture actions remain local acknowledgements; no payment or navigation.

Zero browser warning/error logs were captured. MOCK/REPLAY provider tests replaced fetch with a throwing counter and confirmed zero requests across proposal and both policies. No paid model requests were made during this upgrade.

## Tests and production

- 17 tests passed (11 existing + 6 focused multi-file tests).
- Every one of nine failed gates independently rejects the whole change set; invalid/missing/duplicate operations reject before mutation.
- Rollback snapshot isolation, complete fixture aggregation, receipt accounting, restricted brand exception, offline provider output and server/client operation parity pass.
- Existing operation-lock and reset tests pass; new multi-file reset/locks also verified through browser interactions.
- TypeScript project build passed; Vite production build passed.
- Vite reports its existing large axe chunk warning; axe is separately loaded. Node's test loader emits a deprecation warning on the installed runtime. Neither is a build/test failure.
- Production preview tested at desktop1440 and mobile390: document scrollWidth equals clientWidth. Each fixture remains375 wide; narrow wrappers scroll independently. Temporary viewport override reset after testing.

## Limitations and demo

LIVE is optional and implemented with strict multi-file structured output, but **not live-tested in this upgrade**, as requested to avoid credits. The scenario is intentionally bounded to allowlisted operations, including a planned unsafe first candidate. REPLAY uses the audited bundled multi-file proposal; it is not fresh model reasoning. No arbitrary repo, actual source mutation/git rollback, CI integration or full WCAG claim.

The model-call count reflects returned provider metadata; failed live requests may have unknown upstream usage. Use MOCK/REPLAY for a guaranteed zero-cost demonstration.

See README for the exact 0–90-second judge script. Actual automatic work finishes in seconds; the policy gate allows narration. Recorded elapsed times include time spent inspecting the page and therefore are not performance benchmarks.

The interface leads with an AI change request, three files, a persistent contract, an atomic rejection matrix, rollback proof and a receipt. Its demonstrated scope is transactional enforcement around frontend agents, beyond a single-button repair.
