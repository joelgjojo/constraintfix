import type { AgentProvider } from "@/agent/types";
import { codexAgent } from "@/agent/codex-agent";
import { withDemoFallback } from "@/agent/fallback-agent";
import { mockAgent } from "@/agent/mock-agent";
import { replayAgent } from "@/agent/replay-agent";

export type AgentMode = "mock" | "replay" | "live";

export function resolveAgentMode(value?: string): AgentMode {
  const normalized = value?.toLowerCase();
  return normalized === "live" || normalized === "replay" ? normalized : "mock";
}

const browserEnvironment = import.meta.env as ImportMetaEnv | undefined;
const configuredMode = resolveAgentMode(browserEnvironment?.VITE_AGENT_MODE ?? browserEnvironment?.VITE_AGENT_PROVIDER);
const useCodexLive = configuredMode === "live";

// The UI and verifier only depend on this interface. API credentials stay on the server.
export const agentProvider: AgentProvider = useCodexLive
  ? withDemoFallback(codexAgent, replayAgent)
  : configuredMode === "replay" ? replayAgent : mockAgent;

export const requestedProvider = useCodexLive ? "OPENAI LIVE · replay fallback" : configuredMode === "replay" ? "OPENAI REPLAY" : "MOCK";
