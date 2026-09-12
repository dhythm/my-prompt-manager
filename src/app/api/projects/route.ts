import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { toClientProject } from "@/lib/projects/serialize";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { parseCreateProjectInput } from "@/server/projects/input";
import { createProject, listProjects } from "@/server/projects/repository";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const db = await getDb();
    const projects = await listProjects(db, user.id);
    return NextResponse.json({ projects });
  } catch (error) {
    return errorResponse(error, t("error.projectsLoadFailed"));
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const input = parseCreateProjectInput(await request.json());
    const db = await getDb();
    const project = await createProject(db, user.id, input);
    return NextResponse.json(
      {
        project: toClientProject({ ...project, teamName: null }),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, t("error.projectCreateFailed"));
  }
}
