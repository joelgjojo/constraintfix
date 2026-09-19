import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { openaiDecisionProxy } from "./server/codex-proxy";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const agentMode = (process.env.VITE_AGENT_MODE ?? environment.VITE_AGENT_MODE ?? environment.VITE_AGENT_PROVIDER ?? "mock").toLowerCase();
  const liveDecisionMode = agentMode === "live";
  const buildSha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local";

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Mock/replay mode does not register a model API route, even when a key exists.
      ...(liveDecisionMode ? [openaiDecisionProxy()] : []),
    ],
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
    },
    define: {
      __BUILD_SHA__: JSON.stringify(buildSha.slice(0, 7)),
    },
  };
});
