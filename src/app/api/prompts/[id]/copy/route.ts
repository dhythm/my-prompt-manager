import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { parseCopyPromptInput } from "@/server/projects/input";
import { copyPromptToProject } from "@/server/prompts/copy";
import { serializePrompt } from "@/server/prompts/serialize";

export async function POST(
  request: Request,
  context: RouteContext<"/api/prompts/[id]/copy">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const { projectId } = parseCopyPromptInput(await request.json());
    const db = await getDb();
    const prompt = await copyPromptToProject(db, user.id, id, projectId);
    return NextResponse.json(
      { prompt: serializePrompt(prompt) },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, t("error.promptCopyFailed"));
  }
}
