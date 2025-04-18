import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as ProjectService from "@/lib/services/project-service";

type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const supabase = await createClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = user.id;

    try {
      const project = await ProjectService.getProjectById(projectId, userId);
      return NextResponse.json({ project });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener el proyecto";
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error del servidor";
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

    const supabase = await createClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();

    // Validación básica
    if (!body.title) {
      return NextResponse.json(
        { error: "El título es obligatorio" },
        { status: 400 },
      );
    }

    try {
      // if (body.files && body.files.length > 0) {
      //   await ProjectService.addFilesToProject(projectId, userId, body.files);
      // }

      const project = await ProjectService.updateProject(projectId, userId, {
        title: body.title,
        description: body.description,
        assignedToId: body.assignedToId,
        files: body.files,
      });

      return NextResponse.json({ project });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al actualizar el proyecto";
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error del servidor";
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

    const supabase = await createClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = user.id;

    try {
      await ProjectService.deleteProject(projectId, userId, supabase);
      return NextResponse.json({ success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar el proyecto";
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
