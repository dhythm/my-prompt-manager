import { NextResponse } from "next/server";
import { t } from "@/lib/i18n/t";
import { toClientProject } from "@/lib/projects/serialize";
import { errorResponse, unauthorized } from "@/server/api/respond";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { parseRenameProjectInput } from "@/server/projects/input";
import { deleteProject, renameProject } from "@/server/projects/repository";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/projects/[id]">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const input = parseRenameProjectInput(await request.json());
    const db = await getDb();
    const project = await renameProject(db, user.id, id, input);
    return NextResponse.json({
      project: toClientProject({ ...project, teamName: null }),
    });
  } catch (error) {
    return errorResponse(error, t("error.projectRenameFailed"));
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/projects/[id]">,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const db = await getDb();
    await deleteProject(db, user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, t("error.projectDeleteFailed"));
  }
}
