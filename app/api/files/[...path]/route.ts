import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as ProjectService from "@/lib/services/project-service";

type Params = Promise<{ path: string[] }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const pathname = resolvedParams.path.join("/");

  const file = await prisma.file.findFirst({
    where: { path: pathname },
  });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const canView = await ProjectService.canViewProject(
    session.user.id,
    file.projectId,
  );
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await get(pathname, { access: "private" });

    if (!result) {
      return NextResponse.json(
        { error: "File not available" },
        { status: 404 },
      );
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not available" }, { status: 404 });
  }
}
