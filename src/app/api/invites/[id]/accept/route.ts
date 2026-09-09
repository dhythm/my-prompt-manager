import { NextResponse } from "next/server";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { acceptInvite } from "@/server/teams/repository";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/invites/[id]/accept">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const db = await getDb();
    await acceptInvite(db, user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Failed to accept invite");
  }
}
