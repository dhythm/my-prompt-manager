import { NextResponse } from "next/server";
import { applySessionCookie } from "@/server/auth/cookies";
import {
  isDummySignInError,
  parseDummySignInInput,
} from "@/server/auth/dummy/input";
import { findDummyUserByEmail } from "@/server/auth/dummy/users";
import { resolveAuthConfig } from "@/server/auth/env";
import { getDb } from "@/server/db/client";

export async function POST(request: Request) {
  try {
    const config = resolveAuthConfig(process.env);
    if (config.provider !== "dummy") {
      return NextResponse.json(
        { error: "Dummy sign-in is only available when AUTH_PROVIDER=dummy" },
        { status: 400 },
      );
    }

    const input = parseDummySignInInput(await readBody(request));
    const db = await getDb();
    const user = await findDummyUserByEmail(db, input.email);
    if (!user) {
      return NextResponse.json(
        { error: "Unknown dummy user" },
        { status: 404 },
      );
    }

    const response = wantsRedirect(request)
      ? NextResponse.redirect(new URL("/", request.url), 303)
      : NextResponse.json({ user });
    applySessionCookie(response, user.id, config.secret);
    return response;
  } catch (error) {
    if (isDummySignInError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}

async function readBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return request.json();
  }

  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

function wantsRedirect(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return !contentType.includes("application/json");
}
