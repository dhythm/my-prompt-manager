import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { parseListRunsQuery } from "@/server/prompts/input";
import { listWorkspaceRuns } from "@/server/prompts/runs";
import { serializeRun } from "@/server/prompts/serialize";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const query = parseListRunsQuery(new URL(request.url).searchParams);
    const db = await getDb();
    const page = await listWorkspaceRuns(db, user.id, query);
    return NextResponse.json({
      runs: page.runs.map(serializeRun),
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    return errorResponse(error, t("error.runsLoadFailed"));
  }
}
