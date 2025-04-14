import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as ProjectService from "@/lib/services/project-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
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
    const projectId = params.id;

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error al parsear JSON:", parseError);
      return NextResponse.json(
        { error: "Formato de solicitud JSON inválido" },
        { status: 400 },
      );
    }

    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron archivos válidos" },
        { status: 400 },
      );
    }

    try {
      await ProjectService.addFilesToProject(projectId, userId, body.files);
      return NextResponse.json({ success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al agregar archivos al proyecto";
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
