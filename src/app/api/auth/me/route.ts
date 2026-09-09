import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { resolveAuthConfig } from "@/server/auth/env";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      provider: resolveAuthConfig(process.env).provider,
      user: user ?? null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load the current user" },
      { status: 500 },
    );
  }
}
