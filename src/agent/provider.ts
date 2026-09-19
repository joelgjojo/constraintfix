import type { AgentProvider } from "@/agent/types";
import { codexAgent } from "@/agent/codex-agent";
import { withDemoFallback } from "@/agent/fallback-agent";
import { mockAgent } from "@/agent/mock-agent";
import { replayAgent } from "@/agent/replay-agent";

const configuredMode = (import.meta.env.VITE_AGENT_MODE ?? import.meta.env.VITE_AGENT_PROVIDER ?? "mock").toLowerCase();
const useCodexLive = configuredMode === "live";

// The UI and verifier only depend on this interface. API credentials stay on the server.
export const agentProvider: AgentProvider = useCodexLive
  ? withDemoFallback(codexAgent, replayAgent)
  : configuredMode === "replay" ? replayAgent : mockAgent;

export const requestedProvider = useCodexLive ? "CODEX LIVE · replay fallback" : configuredMode === "replay" ? "CODEX REPLAY" : "MOCK";
