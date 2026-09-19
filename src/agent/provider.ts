import type { AgentProvider } from "@/agent/types";
import { withDemoFallback } from "@/agent/fallback-agent";
import { mockAgent } from "@/agent/mock-agent";
import { openAIAgent } from "@/agent/openai-agent";

const useOpenAI = import.meta.env.VITE_AGENT_PROVIDER === "openai";

// The UI and verifier only depend on this interface. API credentials stay on the server.
export const agentProvider: AgentProvider = useOpenAI
  ? withDemoFallback(openAIAgent, mockAgent)
  : mockAgent;

export const requestedProvider = useOpenAI ? "OpenAI" : "Demo fallback";
