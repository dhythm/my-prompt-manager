import { NextResponse } from "next/server";
import { DUMMY_DEFAULT_USER_ID } from "@/server/auth/dummy/users";
import { dummyDemoResetAllowed } from "@/server/auth/env";
import { getDb } from "@/server/db/client";
import { ensureSamplePrompts } from "@/server/prompts/seed-samples";

export async function POST() {
  if (!dummyDemoResetAllowed()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const db = await getDb();
  await ensureSamplePrompts(db, DUMMY_DEFAULT_USER_ID);
  return NextResponse.json({ ok: true });
}
