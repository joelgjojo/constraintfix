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

/** Explicit UI selection is locked during a transaction; mock/replay never call fetch. */
export function providerForMode(mode: AgentMode): AgentProvider {
  return mode === "live" ? withDemoFallback(codexAgent, replayAgent) : mode === "replay" ? replayAgent : mockAgent;
}
