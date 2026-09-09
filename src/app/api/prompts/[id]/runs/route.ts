import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { createPromptRun, listPromptRuns } from "@/server/prompts/runs";
import { serializeRun } from "@/server/prompts/serialize";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/prompts/[id]/runs">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const db = await getDb();
    const runs = await listPromptRuns(db, user.id, id);
    return NextResponse.json({ runs: runs.map(serializeRun) });
  } catch (error) {
    return errorResponse(error, t("error.runsLoadFailed"));
  }
}

export async function POST(
  _request: Request,
  context: RouteContext<"/api/prompts/[id]/runs">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const db = await getDb();
    const run = await createPromptRun(db, user.id, id);
    return NextResponse.json({ run: serializeRun(run) }, { status: 201 });
  } catch (error) {
    return errorResponse(error, t("error.runRecordFailed"));
  }
}
