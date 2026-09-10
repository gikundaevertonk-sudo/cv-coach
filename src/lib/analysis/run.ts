import { getProvider } from "@/lib/ai";
import { parseModelJSON } from "@/lib/ai/json";
import { analysisResultSchema, type AnalysisResult, type AnalyzeRequest } from "./schema";
import { REPAIR_PROMPT, SYSTEM_PROMPT, buildUserMessage } from "./prompt";

export type AnalysisRun = {
  result: AnalysisResult;
  provider: string;
  model: string;
};

export async function runAnalysis(input: AnalyzeRequest): Promise<AnalysisRun> {
  const provider = getProvider();
  const user = buildUserMessage(input);

  const first = await provider.generateJSON({ system: SYSTEM_PROMPT, user });
  let result = parseModelJSON(first, analysisResultSchema);

  if (!result) {
    const second = await provider.generateJSON({
      system: SYSTEM_PROMPT,
      user: `${user}\n\n---\nYou previously replied:\n${first}\n\n${REPAIR_PROMPT}`,
    });
    result = parseModelJSON(second, analysisResultSchema);
  }

  if (!result) {
    throw new Error("The model did not return a usable analysis. Try again.");
  }

  return { result, provider: provider.name, model: provider.model };
}
