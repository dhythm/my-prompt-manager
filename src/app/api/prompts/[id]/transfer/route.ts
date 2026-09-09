import { NextResponse } from "next/server";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { transferPrompt } from "@/server/prompts/repository";
import { serializePrompt } from "@/server/prompts/serialize";
import { parseTransferInput } from "@/server/teams/input";

export async function POST(
  request: Request,
  context: RouteContext<"/api/prompts/[id]/transfer">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const { teamId } = parseTransferInput(await request.json());
    const db = await getDb();
    const prompt = await transferPrompt(db, user.id, id, teamId);
    return NextResponse.json({
      prompt: serializePrompt({ ...prompt, teamName: null }),
    });
  } catch (error) {
    return errorResponse(error, "Failed to transfer prompt");
  }
}
