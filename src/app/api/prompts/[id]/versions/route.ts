import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { serializeVersion } from "@/server/prompts/serialize";
import { listPromptVersions } from "@/server/prompts/versions";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/prompts/[id]/versions">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const db = await getDb();
    const versions = await listPromptVersions(db, user.id, id);
    return NextResponse.json({ versions: versions.map(serializeVersion) });
  } catch (error) {
    return errorResponse(error, t("error.versionsLoadFailed"));
  }
}
