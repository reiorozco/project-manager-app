"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserRole } from "@prisma/client";
import { useAuth } from "@/app/auth/auth-context";

// Tipos de datos
interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assignedToId: string | null;
  createdBy: {
    name: string | null;
    email: string;
  };
  assignedTo: {
    name: string | null;
    email: string;
  } | null;
  files: {
    id: string;
    filename: string;
    path: string;
    size: number;
  }[];
}

export default function ProjectsPage() {
  const { user, userRole } = useAuth();
  console.log(user);

  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error("Error al cargar los proyectos");
        }

        const data = await response.json();
        setProjects(data.projects);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar los proyectos",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchProjects();
  }, []);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const response = await fetch(`/api/projects/${projectToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el proyecto");
      }

      // Actualizar lista de proyectos
      setProjects(projects.filter((p) => p.id !== projectToDelete));
      setProjectToDelete(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar el proyecto",
      );
    }
  };

  const canCreateProject =
    userRole === UserRole.CLIENT || userRole === UserRole.PROJECT_MANAGER;
  const canManageProject = (project: Project) =>
    userRole === UserRole.PROJECT_MANAGER ||
    (userRole === UserRole.CLIENT && project.createdById === user?.id);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Cargando proyectos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg max-w-3xl mx-auto my-8">
        <h2 className="text-lg font-semibold">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Proyectos</h1>

        {canCreateProject && (
          <Button onClick={() => router.push("/dashboard/projects/new")}>
            Nuevo Proyecto
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-medium text-gray-600">
            No hay proyectos disponibles
          </h2>
          {canCreateProject && (
            <p className="mt-2 text-gray-500">
              Haz clic en &#34;Nuevo Proyecto&#34; para comenzar.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.title}</CardTitle>

                  {canManageProject(project) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">Abrir menú</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/dashboard/projects/${project.id}/edit`,
                            )
                          }
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setProjectToDelete(project.id)}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    {project.description || "Sin descripción"}
                  </p>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>
                    <span className="font-medium">Creado por:</span>{" "}
                    {project.createdBy.name || project.createdBy.email}
                  </div>
                  <div>
                    <span className="font-medium">Asignado a:</span>{" "}
                    {project.assignedTo
                      ? project.assignedTo.name || project.assignedTo.email
                      : "Sin asignar"}
                  </div>
                  <div>
                    <span className="font-medium">Archivos:</span>{" "}
                    {project.files.length}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/dashboard/projects/${project.id}`)
                  }
                >
                  Ver detalles
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={() => setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El proyecto y todos sus archivos
              serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
