import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { resolveDatabaseConfig } from "@/server/db/env";

export async function GET() {
  try {
    const config = resolveDatabaseConfig(process.env);
    const db = await getDb();
    await db.execute(sql`select 1`);

    return NextResponse.json({
      ok: true,
      driver: config.driver,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Database is unavailable" },
      { status: 500 },
    );
  }
}
