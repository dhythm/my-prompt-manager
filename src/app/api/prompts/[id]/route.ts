import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { parseSavePromptInput } from "@/server/prompts/input";
import { serializePrompt, serializeVersion } from "@/server/prompts/serialize";
import { getPromptDetail, savePromptVersion } from "@/server/prompts/versions";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/prompts/[id]">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const db = await getDb();
    const detail = await getPromptDetail(db, user.id, id);
    return NextResponse.json({
      prompt: serializePrompt({ ...detail.prompt, teamName: null }),
      version: serializeVersion(detail.version),
      messages: detail.messages.map((message) => ({
        id: message.id,
        role: message.role as "system" | "user" | "assistant",
        content: message.content,
        position: message.position,
      })),
    });
  } catch (error) {
    return errorResponse(error, t("error.promptLoadFailed"));
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/prompts/[id]">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const input = parseSavePromptInput(await request.json());
    const db = await getDb();
    const saved = await savePromptVersion(db, user.id, id, input);
    return NextResponse.json({
      prompt: serializePrompt({ ...saved.prompt, teamName: null }),
      version: serializeVersion(saved.version),
    });
  } catch (error) {
    return errorResponse(error, t("error.promptSaveFailed"));
  }
}
