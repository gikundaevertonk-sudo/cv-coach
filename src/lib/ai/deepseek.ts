import OpenAI from "openai";
import { AIConfigError, type AIProvider, type GenerateJSONParams } from "./types";

// DeepSeek ships an OpenAI-compatible API, so we reuse the OpenAI SDK with a
// different base URL.
const DEFAULT_MODEL = "deepseek-chat";
const DEFAULT_BASE_URL = "https://api.deepseek.com";

/** Largest `max_tokens` each model family accepts for output. */
function outputCap(model: string): number {
  return model.includes("reasoner") ? 64_000 : 8_192;
}

export function createDeepSeekProvider(): AIProvider {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new AIConfigError(
      "DEEPSEEK_API_KEY is not set. Add it to .env.local or switch AI_PROVIDER.",
    );
  }

  const model = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  const baseURL = process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL;
  const client = new OpenAI({ apiKey, baseURL });

  // deepseek-reasoner (R1) rejects response_format; deepseek-chat honours it.
  const jsonMode = !model.includes("reasoner");

  return {
    name: "deepseek",
    model,
    async generateJSON({ system, user, maxTokens = 16000 }: GenerateJSONParams) {
      const response = await client.chat.completions.create({
        model,
        max_tokens: Math.min(maxTokens, outputCap(model)),
        ...(jsonMode
          ? { response_format: { type: "json_object" as const } }
          : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (!text) {
        throw new Error("The model returned an empty response.");
      }
      return text;
    },
  };
}
