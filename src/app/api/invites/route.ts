import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { listPendingInvites } from "@/server/teams/repository";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const db = await getDb();
    const invites = await listPendingInvites(db, user.email);
    return NextResponse.json({
      invites: invites.map((invite) => ({
        id: invite.id,
        teamId: invite.teamId,
        teamName: invite.teamName,
      })),
    });
  } catch (error) {
    return errorResponse(error, t("error.invitesLoadFailed"));
  }
}
