import { NextRequest, NextResponse } from "next/server";
import { ProjectStatus } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import * as ProjectService from "@/lib/services/project-service";

type Params = Promise<{ id: string }>;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { id: projectId } = await params;

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const status = body.status as ProjectStatus;

    if (!status || !Object.values(ProjectStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    try {
      const project = await ProjectService.updateProjectStatus(
        projectId,
        session.user.id,
        status,
      );
      return NextResponse.json({ project });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error while updating the status";
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
