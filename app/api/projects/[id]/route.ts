import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as ProjectService from "@/lib/services/project-service";

type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
      const project = await ProjectService.getProjectById(projectId, userId);
      return NextResponse.json({ project });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error while loading the project";
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }

    try {
      const project = await ProjectService.updateProject(projectId, userId, {
        title: body.title,
        description: body.description,
        status: body.status,
        dueDate: body.dueDate,
        assignedToId: body.assignedToId,
        files: body.files,
      });

      return NextResponse.json({ project });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error while updating the project";
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
      await ProjectService.deleteProject(projectId, userId);
      return NextResponse.json({ success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error while deleting the project";
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
