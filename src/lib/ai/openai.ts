import OpenAI from "openai";
import { AIConfigError, type AIProvider, type GenerateJSONParams } from "./types";

const DEFAULT_MODEL = "gpt-4o";

export function createOpenAIProvider(): AIProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AIConfigError(
      "OPENAI_API_KEY is not set. Add it to .env.local or switch AI_PROVIDER.",
    );
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const client = new OpenAI({ apiKey });

  return {
    name: "openai",
    model,
    async generateJSON({ system, user, maxTokens = 16000 }: GenerateJSONParams) {
      const response = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
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
