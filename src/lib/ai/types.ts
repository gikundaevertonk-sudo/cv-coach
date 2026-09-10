export type GenerateJSONParams = {
  /** System / developer instructions. */
  system: string;
  /** The user message containing the CV and job description. */
  user: string;
  /** Upper bound on output tokens. */
  maxTokens?: number;
};

export interface AIProvider {
  /** Human-readable id, e.g. "anthropic" / "openai". */
  readonly name: string;
  /** The concrete model that will be used. */
  readonly model: string;
  /**
   * Runs a single completion and returns the raw assistant text, which is
   * expected to be a JSON document. Parsing / validation happens upstream.
   */
  generateJSON(params: GenerateJSONParams): Promise<string>;
}

export class AIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigError";
  }
}
