import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import {
  parseListRunsQuery,
  parseRecordRunInput,
} from "@/server/prompts/input";
import { createPromptRun, listPromptRuns } from "@/server/prompts/runs";
import { serializeRun } from "@/server/prompts/serialize";

export const maxDuration = 60;

export async function GET(
  request: Request,
  context: RouteContext<"/api/prompts/[id]/runs">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const query = parseListRunsQuery(new URL(request.url).searchParams);
    const db = await getDb();
    const page = await listPromptRuns(db, user.id, id, query);
    return NextResponse.json({
      runs: page.runs.map(serializeRun),
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    return errorResponse(error, t("error.runsLoadFailed"));
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/prompts/[id]/runs">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const { variables, model } = parseRecordRunInput(await request.json());
    const db = await getDb();
    const run = await createPromptRun(db, user.id, id, { variables, model });
    return NextResponse.json({ run: serializeRun(run) }, { status: 201 });
  } catch (error) {
    return errorResponse(error, t("error.runRecordFailed"));
  }
}
