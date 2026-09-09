import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { parseCreatePromptInput } from "@/server/prompts/input";
import { createPrompt, listPrompts } from "@/server/prompts/repository";
import { serializePrompt } from "@/server/prompts/serialize";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const db = await getDb();
    const prompts = await listPrompts(db, user.id);
    return NextResponse.json({ prompts: prompts.map(serializePrompt) });
  } catch (error) {
    return errorResponse(error, t("error.promptsLoadFailed"));
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const input = parseCreatePromptInput(await request.json());
    const db = await getDb();
    const prompt = await createPrompt(db, user.id, input);
    return NextResponse.json(
      { prompt: serializePrompt({ ...prompt, teamName: null }) },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, t("error.promptCreateFailed"));
  }
}
