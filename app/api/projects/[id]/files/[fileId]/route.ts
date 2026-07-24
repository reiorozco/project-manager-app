import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as ProjectService from "@/lib/services/project-service";

type Params = Promise<{ id: string; fileId: string }>;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.fileId;

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
      await ProjectService.removeFileFromProject(fileId, userId);
      return NextResponse.json({ success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete file.";

      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
