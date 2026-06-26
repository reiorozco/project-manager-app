// app/api/users/designers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, UserRole } from "@/generated/prisma";
import { createClient } from "@/lib/supabase/server";

const prisma = new PrismaClient();

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

    // Check whether the user is a Project Manager
    const userRole = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (userRole?.role !== UserRole.PROJECT_MANAGER) {
      return NextResponse.json(
        { error: "You don't have permission to access this information" },
        { status: 403 },
      );
    }

    // Get all designers
    const designers = await prisma.user.findMany({
      where: { role: UserRole.DESIGNER },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ designers });
  } catch (error) {
    console.error("Error fetching designers:", error);

    return NextResponse.json(
      { error: "Failed to process the request" },
      { status: 500 },
    );
  }
}
