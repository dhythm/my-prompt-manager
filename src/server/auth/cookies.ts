import type { NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  SIGNED_OUT_COOKIE_NAME,
} from "./session-token";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export function applySessionCookie(
  response: NextResponse,
  userId: string,
  secret: string,
) {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    createSessionToken(userId, secret),
    {
      ...cookieBase,
      maxAge: SESSION_TTL_MS / 1000,
    },
  );
  response.cookies.delete(SIGNED_OUT_COOKIE_NAME);
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.set(SIGNED_OUT_COOKIE_NAME, "1", {
    ...cookieBase,
    maxAge: SESSION_TTL_MS / 1000,
  });
}
