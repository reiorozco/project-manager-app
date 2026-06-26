// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as ProjectService from "@/lib/services/project-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const projects = await ProjectService.getProjectsForUser(userId);

    return NextResponse.json({ projects });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error while loading projects";
    return NextResponse.json({ error: errorMessage }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON request format" },
        { status: 400 },
      );
    }

    // Basic validation
    if (!body.title) {
      return NextResponse.json(
        { error: "Project title is required" },
        { status: 400 },
      );
    }

    const files = body.files || [];
    const project = await ProjectService.createProject({
      title: body.title,
      description: body.description,
      status: body.status,
      dueDate: body.dueDate,
      userId,
      files,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error while creating the project";
    return NextResponse.json({ error: errorMessage }, { status: 403 });
  }
}
