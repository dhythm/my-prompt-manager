import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { getPromptRun } from "@/server/prompts/runs";
import { serializeRun } from "@/server/prompts/serialize";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/runs/[id]">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const db = await getDb();
    const run = await getPromptRun(db, user.id, id);
    return NextResponse.json({ run: serializeRun(run) });
  } catch (error) {
    return errorResponse(error, t("error.runsLoadFailed"));
  }
}
