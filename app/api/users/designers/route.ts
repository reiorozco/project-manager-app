// app/api/users/designers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, UserRole } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = user.id;

    // Verificar si el usuario es Project Manager
    const userRole = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (userRole?.role !== UserRole.PROJECT_MANAGER) {
      return NextResponse.json(
        { error: "No tienes permiso para acceder a esta información" },
        { status: 403 },
      );
    }

    // Obtener todos los diseñadores
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
    console.error("Error al obtener diseñadores:", error);

    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 },
    );
  }
}
