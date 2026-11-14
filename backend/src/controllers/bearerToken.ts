import type { Request } from "express";

/** The Google access token from the `Authorization: Bearer` header, or null when missing. */
export function bearerToken(req: Request): string | null {
  const match = req.header("authorization")?.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}
