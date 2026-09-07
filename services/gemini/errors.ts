export type GeminiErrorCode =
  | "config"
  | "auth"
  | "network"
  | "timeout"
  | "quota"
  | "invalid-json"
  | "invalid-schema"
  | "unknown";

export class GeminiError extends Error {
  readonly code: GeminiErrorCode;

  constructor(code: GeminiErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "GeminiError";
    this.code = code;
  }
}
