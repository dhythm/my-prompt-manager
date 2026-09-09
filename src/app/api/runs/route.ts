import { NextResponse } from "next/server";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { listWorkspaceRuns } from "@/server/prompts/runs";
import { serializeRun } from "@/server/prompts/serialize";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const db = await getDb();
    const runs = await listWorkspaceRuns(db, user.id);
    return NextResponse.json({ runs: runs.map(serializeRun) });
  } catch (error) {
    return errorResponse(error, "Failed to load runs");
  }
}
