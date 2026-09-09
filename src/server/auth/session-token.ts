import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "session";
export const SIGNED_OUT_COOKIE_NAME = "session_signed_out";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export function createSessionToken(
  userId: string,
  secret: string,
  now = Date.now(),
): string {
  const expiresAt = String(now + SESSION_TTL_MS);
  const payload = `${userId}.${expiresAt}`;
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  now = Date.now(),
): string | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return undefined;
  }

  const [userId, expiresAt, signature] = parts;
  if (!userId || !expiresAt || !signature) {
    return undefined;
  }

  const payload = `${userId}.${expiresAt}`;
  const expected = sign(payload, secret);
  if (!safeEqual(expected, signature)) {
    return undefined;
  }

  if (Number(expiresAt) <= now) {
    return undefined;
  }

  return userId;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}
