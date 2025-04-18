import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as ProjectService from "@/lib/services/project-service";

type Params = Promise<{ id: string; fileId: string }>;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.fileId;

    const supabase = await createClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = user.id;

    try {
      await ProjectService.removeFileFromProject(fileId, userId, supabase);
      return NextResponse.json({ success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al eliminar archivo.";

      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
