import { Codex, type Thread } from "@openai/codex-sdk";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { codexCandidateSchema, isStructuredRepairCandidate } from "../src/agent/candidate-schema";

type LiveStage = 1 | 2;

interface LiveDecisionInput {
  transactionId: string;
  stage: LiveStage;
  verification: {
    accessibilityPass?: boolean;
    contrastRatio?: number;
    brandPass?: boolean;
    layoutPass?: boolean;
    brandColor?: string;
  } | null;
  humanChoice?: "preserve_brand";
}

interface CodexSession {
  thread: Thread;
  calls: number;
  expiresAt: number;
}

const sessionLifetimeMs = 10 * 60 * 1000;
const sessions = new Map<string, CodexSession>();

interface CodexProxyOptions {
  apiKey?: string;
}

function writeJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  let body = "";
  for await (const chunk of request) {
    body += String(chunk);
    if (body.length > 20_000) throw new Error("Request body is too large.");
  }
  return JSON.parse(body);
}

function isLiveInput(value: unknown): value is LiveDecisionInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<LiveDecisionInput>;
  const validStage = input.stage === 1 || input.stage === 2;
  const validTransaction = typeof input.transactionId === "string" && /^[a-z0-9-]{16,80}$/i.test(input.transactionId);
  const validChoice = input.stage === 1 || (input.stage === 2 && input.humanChoice === "preserve_brand");
  return validStage && validTransaction && validChoice;
}

function pruneSessions(now = Date.now()) {
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(id);
  }
}

function snapshot(input: LiveDecisionInput) {
  return {
    accessibilityPass: Boolean(input.verification?.accessibilityPass),
    contrastRatio: input.verification?.contrastRatio ?? null,
    brandPass: Boolean(input.verification?.brandPass),
    layoutPass: Boolean(input.verification?.layoutPass),
    brandColor: input.verification?.brandColor ?? "unknown",
  };
}

function firstTurnPrompt(input: LiveDecisionInput) {
  return [
    "You are the planning layer for ConstraintFix, a constrained frontend repair demo.",
    "Return exactly one JSON candidate that matches the supplied output schema. Do not write code, call tools, edit files, or claim verification passed.",
    "The deterministic executor accepts only two mapped actions: darken_cta maps to a CTA background #60A5FA -> #2563EB; change_text_color maps to CTA foreground #FFFFFF -> #0F172A while retaining #60A5FA.",
    "Pick darken_cta only if you accept that it may pass accessibility but fail the protected brand token, requiring a human choice. Pick change_text_color if it is the safer candidate. Browser verification—not you—decides whether it passes.",
    "The task is to propose one bounded repair for the contrast issue after a safe aria-label fix.",
    `Observed deterministic evidence: ${JSON.stringify(snapshot(input))}`,
  ].join("\n");
}

function replanPrompt(input: LiveDecisionInput) {
  return [
    "Machine feedback from the prior candidate: accessibility and 375px layout passed, but the protected token #60A5FA failed. The UI rolled the candidate back.",
    "A human chose preserve_brand. Return exactly one JSON candidate matching the schema.",
    "Choose change_text_color only. It maps to #FFFFFF -> #0F172A while retaining #60A5FA. Do not write code, call tools, edit files, or claim verification passed.",
    `Observed deterministic evidence: ${JSON.stringify(snapshot(input))}`,
  ].join("\n");
}

function createThread(apiKey?: string) {
  const codex = new Codex(apiKey ? { apiKey } : undefined);
  return codex.startThread({
    workingDirectory: process.cwd(),
    sandboxMode: "read-only",
    approvalPolicy: "never",
    networkAccessEnabled: false,
  });
}

async function runBoundedTurn(thread: Thread, prompt: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28_000);
  try {
    return await thread.run(prompt, { outputSchema: codexCandidateSchema, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * The route exists only in VITE_AGENT_MODE=live. One transaction can use two
 * model turns: the initial candidate and the human-directed replan on the same
 * in-memory Codex thread. All execution remains in the browser fixture map.
 */
export function codexDecisionProxy({ apiKey }: CodexProxyOptions = {}): Plugin {
  return {
    name: "constraintfix-codex-decision-proxy",
    configureServer(server) {
      server.middlewares.use("/api/codex/decision", async (request, response) => {
        if (request.method !== "POST") {
          writeJson(response, 405, { error: "Method not allowed." });
          return;
        }

        let transactionId: string | null = null;
        try {
          const payload = await readJson(request);
          if (!isLiveInput(payload)) {
            writeJson(response, 400, { error: "Invalid live decision input." });
            return;
          }
          transactionId = payload.transactionId;

          pruneSessions();
          let session = sessions.get(payload.transactionId);
          if (payload.stage === 1) {
            if (session) {
              writeJson(response, 409, { error: "A live candidate was already requested for this transaction." });
              return;
            }
            session = { thread: createThread(apiKey), calls: 0, expiresAt: Date.now() + sessionLifetimeMs };
            sessions.set(payload.transactionId, session);
          } else if (!session || session.calls !== 1) {
            writeJson(response, 409, { error: "A resumable Codex thread was not found for this transaction." });
            return;
          }

          if (session.calls >= 2) {
            writeJson(response, 429, { error: "This transaction has reached its two-turn Codex limit." });
            return;
          }

          const turn = await runBoundedTurn(session.thread, payload.stage === 1 ? firstTurnPrompt(payload) : replanPrompt(payload));
          const candidate: unknown = JSON.parse(turn.finalResponse);
          if (!isStructuredRepairCandidate(candidate)) {
            sessions.delete(payload.transactionId);
            writeJson(response, 422, { error: "Codex returned an invalid structured candidate." });
            return;
          }
          if (payload.stage === 2 && candidate.action !== "change_text_color") {
            sessions.delete(payload.transactionId);
            writeJson(response, 422, { error: "The replan did not preserve the protected token." });
            return;
          }

          session.calls += 1;
          session.expiresAt = Date.now() + sessionLifetimeMs;
          writeJson(response, 200, {
            type: payload.stage === 1 ? "apply_patch" : "replan",
            action: candidate.action,
            candidate,
            modelCalls: session.calls,
            usedThread: true,
          });
        } catch {
          if (transactionId) sessions.delete(transactionId);
          // Do not leak local authentication or CLI details; the browser uses its replay fallback.
          writeJson(response, 502, { error: "Codex decision service is unavailable." });
        }
      });
    },
  };
}

export const __testables = { isLiveInput, pruneSessions, sessions };
