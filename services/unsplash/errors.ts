export type UnsplashErrorCode = "config" | "auth" | "rate-limit" | "network" | "timeout" | "unknown";

export class UnsplashError extends Error {
  readonly code: UnsplashErrorCode;

  constructor(code: UnsplashErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "UnsplashError";
    this.code = code;
  }
}
