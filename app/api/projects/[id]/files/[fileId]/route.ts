import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import * as ProjectService from "@/lib/services/project-service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } },
) {
  try {
    const supabase = await createClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = user.id;
    const fileId = params.fileId;

    try {
      await ProjectService.removeFileFromProject(fileId, userId);
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
