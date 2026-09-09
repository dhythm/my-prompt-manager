import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { listDummyUsers } from "@/server/auth/dummy/users";
import { resolveAuthConfig } from "@/server/auth/env";
import { getDb } from "@/server/db/client";

export async function GET() {
  try {
    if (resolveAuthConfig(process.env).provider !== "dummy") {
      return NextResponse.json({ users: [] });
    }

    const db = await getDb();
    const users = await listDummyUsers(db);
    return NextResponse.json({ users });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: t("error.usersLoadFailed") },
      { status: 500 },
    );
  }
}
