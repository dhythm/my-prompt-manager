import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applySessionCookie } from "@/server/auth/cookies";
import { DUMMY_DEFAULT_USER_ID } from "@/server/auth/dummy/users";
import { resolveAuthConfig } from "@/server/auth/env";
import {
  SESSION_COOKIE_NAME,
  SIGNED_OUT_COOKIE_NAME,
} from "@/server/auth/session-token";

export function proxy(request: NextRequest) {
  const auth = resolveAuthConfig(process.env);
  if (auth.provider !== "dummy" || !auth.autoSignIn) {
    return NextResponse.next();
  }

  if (
    request.cookies.has(SESSION_COOKIE_NAME) ||
    request.cookies.has(SIGNED_OUT_COOKIE_NAME)
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  applySessionCookie(response, DUMMY_DEFAULT_USER_ID, auth.secret);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
