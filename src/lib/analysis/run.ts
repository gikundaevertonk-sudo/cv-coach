import { getProvider } from "@/lib/ai";
import { analysisResultSchema, type AnalysisResult, type AnalyzeRequest } from "./schema";
import { REPAIR_PROMPT, SYSTEM_PROMPT, buildUserMessage } from "./prompt";

export type AnalysisRun = {
  result: AnalysisResult;
  provider: string;
  model: string;
};

/** Pull a JSON object out of a model reply that may be fenced or padded. */
function extractJSON(raw: string): unknown {
  let text = raw.trim();

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) text = fence[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  return JSON.parse(text);
}

function parse(raw: string): AnalysisResult | null {
  try {
    return analysisResultSchema.parse(extractJSON(raw));
  } catch {
    return null;
  }
}

export async function runAnalysis(input: AnalyzeRequest): Promise<AnalysisRun> {
  const provider = getProvider();
  const user = buildUserMessage(input);

  const first = await provider.generateJSON({ system: SYSTEM_PROMPT, user });
  let result = parse(first);

  if (!result) {
    const second = await provider.generateJSON({
      system: SYSTEM_PROMPT,
      user: `${user}\n\n---\nYou previously replied:\n${first}\n\n${REPAIR_PROMPT}`,
    });
    result = parse(second);
  }

  if (!result) {
    throw new Error("The model did not return a usable analysis. Try again.");
  }

  return { result, provider: provider.name, model: provider.model };
}
