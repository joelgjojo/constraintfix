import type { Plugin } from "vite";
import decisionHandler from "../api/codex/decision";

/** Makes the same server-only Responses API route available during `npm run dev`. */
export function openaiDecisionProxy(): Plugin {
  return {
    name: "constraintfix-openai-decision-proxy",
    configureServer(server) {
      server.middlewares.use("/api/codex/decision", (request, response) => {
        void decisionHandler(request, response);
      });
    },
  };
}
