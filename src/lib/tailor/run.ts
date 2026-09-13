import { getProvider } from "@/lib/ai";
import { parseModelJSON } from "@/lib/ai/json";
import { REPAIR_PROMPT, SYSTEM_PROMPT, buildUserMessage } from "./prompt";
import { tailorResultSchema, type TailorRequest, type TailorResult } from "./schema";

export type TailorRun = {
  result: TailorResult;
  provider: string;
  model: string;
};

export async function runTailor(input: TailorRequest): Promise<TailorRun> {
  const provider = getProvider();
  const user = buildUserMessage(input);

  const first = await provider.generateJSON({
    system: SYSTEM_PROMPT,
    user,
    maxTokens: 4000,
  });
  let result = parseModelJSON(first, tailorResultSchema);

  if (!result) {
    const second = await provider.generateJSON({
      system: SYSTEM_PROMPT,
      user: `${user}\n\n---\nYou previously replied:\n${first}\n\n${REPAIR_PROMPT}`,
      maxTokens: 4000,
    });
    result = parseModelJSON(second, tailorResultSchema);
  }

  if (!result) {
    throw new Error(
      "The model did not return a usable CV and cover letter. Try again.",
    );
  }

  return { result, provider: provider.name, model: provider.model };
}
