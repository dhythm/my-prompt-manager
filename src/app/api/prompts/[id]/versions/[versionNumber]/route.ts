import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { createNotFoundError } from "@/server/errors";
import { serializeMessage, serializeVersion } from "@/server/prompts/serialize";
import { getPromptVersion } from "@/server/prompts/versions";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/prompts/[id]/versions/[versionNumber]">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id, versionNumber: rawVersionNumber } = await context.params;
    const versionNumber = Number(rawVersionNumber);
    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      throw createNotFoundError(t("error.promptVersionNotFound"));
    }

    const db = await getDb();
    const detail = await getPromptVersion(db, user.id, id, versionNumber);
    return NextResponse.json({
      version: serializeVersion(detail.version),
      messages: detail.messages.map(serializeMessage),
    });
  } catch (error) {
    return errorResponse(error, t("error.versionLoadFailed"));
  }
}
