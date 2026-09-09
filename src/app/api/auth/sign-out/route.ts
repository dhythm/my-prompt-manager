import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/server/auth/cookies";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const response = contentType.includes("application/json")
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL("/sign-in", request.url), 303);

  clearSessionCookie(response);
  return response;
}
