import { createAnthropicProvider } from "./anthropic";
import { createDeepSeekProvider } from "./deepseek";
import { createOpenAIProvider } from "./openai";
import { AIConfigError, type AIProvider } from "./types";

export { AIConfigError } from "./types";
export type { AIProvider } from "./types";

type ProviderName = "anthropic" | "openai" | "deepseek";

const PROVIDER_NAMES: readonly ProviderName[] = ["anthropic", "openai", "deepseek"];

function resolveProviderName(): ProviderName {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit) {
    if ((PROVIDER_NAMES as readonly string[]).includes(explicit)) {
      return explicit as ProviderName;
    }
    throw new AIConfigError(
      `Unknown AI_PROVIDER "${explicit}". Use ${PROVIDER_NAMES.join(", ")}.`,
    );
  }

  // Auto-detect from whichever key is configured; prefer Anthropic.
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.DEEPSEEK_API_KEY) return "deepseek";

  throw new AIConfigError(
    "No AI provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY or DEEPSEEK_API_KEY in .env.local.",
  );
}

/**
 * Returns the configured AI provider. Throws {@link AIConfigError} when the
 * environment is missing the keys it needs — callers should surface that as a
 * 500 with the message intact.
 */
export function getProvider(): AIProvider {
  switch (resolveProviderName()) {
    case "anthropic":
      return createAnthropicProvider();
    case "openai":
      return createOpenAIProvider();
    case "deepseek":
      return createDeepSeekProvider();
  }
}
