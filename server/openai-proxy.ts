import OpenAI from "openai";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

type AgentPhase =
  | "idle"
  | "auditing"
  | "planning"
  | "patching"
  | "rendering"
  | "verifying"
  | "conflict"
  | "waiting_for_human"
  | "replanning"
  | "complete"
  | "failed";

interface AgentDecisionInput {
  phase: AgentPhase;
  stage: number;
  verification: unknown;
  humanChoice?: "preserve_brand" | "allow_change";
}

interface ServerDecision {
  type: "apply_patch" | "request_human" | "replan" | "complete";
  action: "add_accessible_name" | "darken_cta" | "change_text_color" | "none";
  reason: string;
  risk: "low" | "medium" | "high";
}

interface OpenAIProxyOptions {
  apiKey?: string;
  model: string;
}

const decisionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["type", "action", "reason", "risk"],
  properties: {
    type: { type: "string", enum: ["apply_patch", "request_human", "replan", "complete"] },
    action: { type: "string", enum: ["add_accessible_name", "darken_cta", "change_text_color", "none"] },
    reason: { type: "string", minLength: 1, maxLength: 280 },
    risk: { type: "string", enum: ["low", "medium", "high"] },
  },
} as const;

function writeJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  let body = "";
  for await (const chunk of request) {
    body += String(chunk);
    if (body.length > 25_000) throw new Error("Request body is too large.");
  }
  return JSON.parse(body);
}

function isDecisionInput(value: unknown): value is AgentDecisionInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<AgentDecisionInput>;
  return typeof input.phase === "string" && typeof input.stage === "number";
}

function isDecision(value: unknown): value is ServerDecision {
  if (!value || typeof value !== "object") return false;
  const decision = value as Partial<ServerDecision>;
  return (
    ["apply_patch", "request_human", "replan", "complete"].includes(decision.type ?? "") &&
    ["add_accessible_name", "darken_cta", "change_text_color", "none"].includes(decision.action ?? "") &&
    ["low", "medium", "high"].includes(decision.risk ?? "") &&
    typeof decision.reason === "string" &&
    decision.reason.length > 0
  );
}

function matchesDemoContract(decision: ServerDecision, input: AgentDecisionInput) {
  if (input.humanChoice === "preserve_brand") {
    return decision.type === "replan" && decision.action === "change_text_color";
  }
  if (input.humanChoice === "allow_change") {
    return decision.type === "complete" && decision.action === "none";
  }
  if (input.stage === 0) return decision.type === "apply_patch" && decision.action === "add_accessible_name";
  if (input.stage === 1) return decision.type === "apply_patch" && decision.action === "darken_cta";
  if (input.stage === 2) return decision.type === "request_human" && decision.action === "none";
  if (input.stage === 3) return decision.type === "complete" && decision.action === "none";
  return false;
}

function instructionsFor(input: AgentDecisionInput) {
  return [
    "You are the reasoning layer for ConstraintFix, a constrained frontend repair demo.",
    "Return exactly one structured decision. Do not claim that verification passed; deterministic browser tools decide that.",
    "The stage contract is fixed for demo safety: stage 0 applies add_accessible_name; stage 1 applies darken_cta; stage 2 requests a human; stage 3 completes.",
    "When the human chooses preserve_brand, replan with change_text_color. When they allow_change, complete with no action.",
    "Use the verification snapshot to write a brief, accurate reason and an appropriate risk level.",
    `Current input: ${JSON.stringify(input)}`,
  ].join("\n");
}

export function openAIDecisionProxy({ apiKey, model }: OpenAIProxyOptions): Plugin {
  const client = apiKey ? new OpenAI({ apiKey }) : null;

  return {
    name: "constraintfix-openai-decision-proxy",
    configureServer(server) {
      server.middlewares.use("/api/agent/decision", async (request, response) => {
        if (request.method !== "POST") {
          writeJson(response, 405, { error: "Method not allowed." });
          return;
        }
        if (!client) {
          writeJson(response, 503, { error: "OpenAI is not configured." });
          return;
        }

        try {
          const input = await readJson(request);
          if (!isDecisionInput(input)) {
            writeJson(response, 400, { error: "Invalid decision input." });
            return;
          }

          const result = await client.responses.create({
            model,
            store: false,
            max_output_tokens: 250,
            reasoning: { effort: "low" },
            text: {
              verbosity: "low",
              format: {
                type: "json_schema",
                name: "repair_decision",
                strict: true,
                schema: decisionSchema,
              },
            },
            instructions: instructionsFor(input),
            input: "Choose the next repair decision from the supplied contract.",
          });

          const decision: unknown = JSON.parse(result.output_text);
          if (!isDecision(decision) || !matchesDemoContract(decision, input)) {
            writeJson(response, 422, { error: "OpenAI decision did not satisfy the safe execution contract." });
            return;
          }

          writeJson(response, 200, decision);
        } catch {
          // Preserve a stable, non-sensitive failure boundary for the browser fallback.
          writeJson(response, 502, { error: "OpenAI decision service is unavailable." });
        }
      });
    },
  };
}
