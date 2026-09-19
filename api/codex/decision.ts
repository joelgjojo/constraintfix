import OpenAI from "openai";
import type { IncomingMessage, ServerResponse } from "node:http";
import { codexCandidateSchema, isStructuredRepairCandidate } from "../../src/agent/candidate-schema";
import type { StructuredRepairCandidate } from "../../src/agent/types";

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

const maxRequestBytes = 20_000;

function writeJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  let body = "";
  for await (const chunk of request) {
    body += String(chunk);
    if (body.length > maxRequestBytes) throw new Error("Request body is too large.");
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

function snapshot(input: LiveDecisionInput) {
  return {
    accessibilityPass: Boolean(input.verification?.accessibilityPass),
    contrastRatio: input.verification?.contrastRatio ?? null,
    brandPass: Boolean(input.verification?.brandPass),
    layoutPass: Boolean(input.verification?.layoutPass),
    brandColor: input.verification?.brandColor ?? "unknown",
  };
}

function planningPrompt(input: LiveDecisionInput) {
  if (input.stage === 2) {
    return [
      "You are the bounded planning layer for ConstraintFix, a frontend repair demo.",
      "A previous contrast repair passed accessibility and 375px layout, but changed protected token #60A5FA. The browser rolled it back and the human chose Preserve Brand.",
      "Return one strict JSON candidate. Its action must be change_text_color. That action maps only to CTA foreground #FFFFFF -> #0F172A while retaining #60A5FA.",
      "Do not write code, invoke tools, claim verification passed, or propose a different action. Deterministic browser verification is the authority.",
      `Observed deterministic evidence: ${JSON.stringify(snapshot(input))}`,
    ].join("\n");
  }

  return [
    "You are the bounded planning layer for ConstraintFix, a frontend repair demo.",
    "The safe aria-label repair already fixed the semantic issue. A contrast repair is now needed.",
    "Return one strict JSON candidate. Its action must be darken_cta. That action maps only to CTA background #60A5FA -> #2563EB and intentionally requires protected-token verification and a possible human decision.",
    "Do not write code, invoke tools, claim verification passed, or propose a different action. Deterministic browser verification is the authority.",
    `Observed deterministic evidence: ${JSON.stringify(snapshot(input))}`,
  ].join("\n");
}

function expectedAction(stage: LiveStage) {
  return stage === 1 ? "darken_cta" : "change_text_color";
}

function isAllowedCandidate(candidate: unknown, stage: LiveStage): candidate is StructuredRepairCandidate {
  return isStructuredRepairCandidate(candidate) && candidate.action === expectedAction(stage);
}

function publicApiError(error: unknown) {
  if (error instanceof OpenAI.AuthenticationError) return { status: 503, message: "Live planning authentication failed." };
  if (error instanceof OpenAI.RateLimitError) return { status: 429, message: "Live planning is temporarily rate limited." };
  if (error instanceof OpenAI.APIConnectionError || error instanceof OpenAI.APIConnectionTimeoutError) {
    return { status: 503, message: "Live planning service is temporarily unavailable." };
  }
  return { status: 502, message: "Live planning returned an invalid response." };
}

/**
 * Vercel Node serverless handler. The key is read only on the server. The
 * browser receives one constrained candidate and performs all execution and
 * verification locally. Requests are deliberately stateless so deployment
 * does not depend on memory surviving between Vercel function invocations.
 */
export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "POST") {
    writeJson(response, 405, { error: "Method not allowed." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    writeJson(response, 503, { error: "Live planning is not configured." });
    return;
  }

  try {
    const payload = await readJson(request);
    if (!isLiveInput(payload)) {
      writeJson(response, 400, { error: "Invalid live decision input." });
      return;
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 25_000,
      maxRetries: 0,
    });
    const completion = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
      input: planningPrompt(payload),
      store: false,
      max_output_tokens: 360,
      text: {
        format: {
          type: "json_schema",
          name: "constraintfix_repair_candidate",
          strict: true,
          schema: codexCandidateSchema,
        },
      },
    });

    const candidate: unknown = JSON.parse(completion.output_text);
    if (!isAllowedCandidate(candidate, payload.stage)) {
      writeJson(response, 422, { error: "Live planning returned an invalid repair candidate." });
      return;
    }

    writeJson(response, 200, {
      type: payload.stage === 1 ? "apply_patch" : "replan",
      action: candidate.action,
      candidate,
      modelCalls: 1,
      usedThread: false,
    });
  } catch (error) {
    const publicError = publicApiError(error);
    writeJson(response, publicError.status, { error: publicError.message });
  }
}

export const __testables = { expectedAction, isAllowedCandidate, isLiveInput, planningPrompt };
