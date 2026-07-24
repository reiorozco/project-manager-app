import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

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
