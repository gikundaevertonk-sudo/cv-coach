import Anthropic from "@anthropic-ai/sdk";
import { AIConfigError, type AIProvider, type GenerateJSONParams } from "./types";

const DEFAULT_MODEL = "claude-opus-5";

export function createAnthropicProvider(): AIProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AIConfigError(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local or switch AI_PROVIDER.",
    );
  }

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const client = new Anthropic({ apiKey });

  return {
    name: "anthropic",
    model,
    async generateJSON({ system, user, maxTokens = 16000 }: GenerateJSONParams) {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        thinking: { type: "adaptive" },
        system,
        messages: [{ role: "user", content: user }],
      });

      if (response.stop_reason === "refusal") {
        throw new Error("The model declined to answer this request.");
      }

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("")
        .trim();

      if (!text) {
        throw new Error("The model returned an empty response.");
      }
      return text;
    },
  };
}
