import { NextResponse } from "next/server";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { parseInviteInput } from "@/server/teams/input";
import { createInvite } from "@/server/teams/repository";

export async function POST(
  request: Request,
  context: RouteContext<"/api/teams/[id]/invites">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const input = parseInviteInput(await request.json());
    const db = await getDb();
    const invite = await createInvite(db, user.id, id, input);
    return NextResponse.json({ invite: { id: invite.id } }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to create invite");
  }
}
