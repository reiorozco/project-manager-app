"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@prisma/client";
import { useAuth } from "@/app/auth/auth-context";
import { Project } from "@/generated/prisma";

interface ProjectStats {
  total: number;
  assigned: number;
  unassigned: number;
}

export default function DashboardPage() {
  const { userRole, user } = useAuth();
  const router = useRouter();
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    total: 0,
    assigned: 0,
    unassigned: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          const projects = data.projects || [];

          setProjectStats({
            total: projects.length,
            assigned: projects.filter((p: Project) => p.assignedToId !== null)
              .length,
            unassigned: projects.filter((p: Project) => p.assignedToId === null)
              .length,
          });
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        Cargando dashboard...
      </div>
    );
  }

  const getRoleText = () => {
    switch (userRole) {
      case UserRole.CLIENT:
        return "Cliente";
      case UserRole.PROJECT_MANAGER:
        return "Project Manager";
      case UserRole.DESIGNER:
        return "Diseñador";
      default:
        return "Usuario";
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-12 md:px-12 text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Bienvenido a Grayola
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Panel de gestión de proyectos de diseño
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Estás conectado como <strong>{getRoleText()}</strong>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Resumen de proyectos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Proyectos totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? "..." : projectStats.total}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Proyectos asignados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? "..." : projectStats.assigned}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Proyectos sin asignar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? "..." : projectStats.unassigned}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-12 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            onClick={() => router.push("/dashboard/projects")}
            className="h-auto py-4"
          >
            <div className="flex flex-col items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 mb-1"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Ver todos los proyectos</span>
            </div>
          </Button>

          {(userRole === UserRole.CLIENT ||
            userRole === UserRole.PROJECT_MANAGER) && (
            <Button
              onClick={() => router.push("/dashboard/projects/new")}
              className="h-auto py-4"
              variant="outline"
            >
              <div className="flex flex-col items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 mb-1"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <span>Crear nuevo proyecto</span>
              </div>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
