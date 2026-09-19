import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { openAIDecisionProxy } from "./server/openai-proxy";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const agentMode = (environment.VITE_AGENT_MODE ?? environment.VITE_AGENT_PROVIDER ?? "mock").toLowerCase();
  const liveDecisionMode = agentMode === "live" || agentMode === "openai";

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Mock mode does not register an API route, even when a local key exists.
      ...(liveDecisionMode
        ? [openAIDecisionProxy({
            apiKey: environment.OPENAI_API_KEY,
            model: environment.OPENAI_MODEL || "gpt-5-mini",
          })]
        : []),
    ],
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
    },
  };
});
