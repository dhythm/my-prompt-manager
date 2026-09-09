import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { parseCreateTeamInput } from "@/server/teams/input";
import { createTeam, listTeams } from "@/server/teams/repository";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const db = await getDb();
    const teams = await listTeams(db, user.id);
    return NextResponse.json({ teams });
  } catch (error) {
    return errorResponse(error, t("error.teamsLoadFailed"));
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const input = parseCreateTeamInput(await request.json());
    const db = await getDb();
    const team = await createTeam(db, user.id, input);
    return NextResponse.json(
      { team: { id: team.id, name: team.name, role: "owner" } },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, t("error.teamCreateFailed"));
  }
}
