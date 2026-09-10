import { createAnthropicProvider } from "./anthropic";
import { createOpenAIProvider } from "./openai";
import { AIConfigError, type AIProvider } from "./types";

export { AIConfigError } from "./types";
export type { AIProvider } from "./types";

type ProviderName = "anthropic" | "openai";

function resolveProviderName(): ProviderName {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "anthropic" || explicit === "openai") {
    return explicit;
  }
  if (explicit) {
    throw new AIConfigError(
      `Unknown AI_PROVIDER "${explicit}". Use "anthropic" or "openai".`,
    );
  }

  // Auto-detect from whichever key is configured; prefer Anthropic.
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";

  throw new AIConfigError(
    "No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.local.",
  );
}

/**
 * Returns the configured AI provider. Throws {@link AIConfigError} when the
 * environment is missing the keys it needs — callers should surface that as a
 * 500 with the message intact.
 */
export function getProvider(): AIProvider {
  const name = resolveProviderName();
  return name === "anthropic"
    ? createAnthropicProvider()
    : createOpenAIProvider();
}
