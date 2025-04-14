"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@prisma/client";
import { useAuth } from "@/app/auth/auth-context";
import { createClient } from "@/utils/supabase/client";

// Tipos
interface ProjectParams {
  params: Promise<{ id: string }>;
}

interface ProjectFile {
  id: string;
  filename: string;
  path: string;
  size: number;
}

interface ProjectUser {
  name: string | null;
  email: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assignedToId: string | null;
  createdBy: ProjectUser;
  assignedTo: ProjectUser | null;
  files: ProjectFile[];
}

export default function ProjectDetailPage({ params }: ProjectParams) {
  // Desenvolver params con React.use() según nueva API de Next.js
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;

  // Hooks y estado
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Cargar datos del proyecto
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("No tienes permiso para ver este proyecto");
          }
          throw new Error("Error al cargar el proyecto");
        }

        const data = await response.json();
        setProject(data.project);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el proyecto",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProject().catch(console.error);
  }, [projectId]);

  // Funciones auxiliares
  const canManageProject = (): boolean => {
    if (!project || !user) return false;

    return (
      userRole === UserRole.PROJECT_MANAGER ||
      (userRole === UserRole.CLIENT && project.createdById === user.id)
    );
  };

  const getFormattedDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const downloadFile = async (file: ProjectFile): Promise<void> => {
    try {
      // Eliminar 'public/' del path para acceder al storage correctamente
      const path = file.path.replace("public/", "");

      const { data, error: downloadError } = await supabase.storage
        .from("project-files")
        .download(path);

      if (downloadError) throw downloadError;

      // Crear blob URL y simular click para descargar
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();

      // Limpiar recursos
      URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setError(
        `Error al descargar el archivo: ${err instanceof Error ? err.message : "error desconocido"}`,
      );
    }
  };

  // Componentes de estado de carga/error
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Cargando proyecto...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <div className="p-6 bg-red-50 text-red-600 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <Button
            onClick={() => router.push("/dashboard/projects")}
            className="mt-4"
            variant="outline"
          >
            Volver a proyectos
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <div className="p-6 bg-orange-50 text-orange-600 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Proyecto no encontrado</h2>
          <p>
            El proyecto que buscas no existe o no tienes permiso para verlo.
          </p>
          <Button
            onClick={() => router.push("/dashboard/projects")}
            className="mt-4"
            variant="outline"
          >
            Volver a proyectos
          </Button>
        </div>
      </div>
    );
  }

  // Componentes para renderizar secciones específicas
  const ProjectHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <div className="flex items-center space-x-4 mt-2">
          <p className="text-sm text-gray-500">
            Creado: {getFormattedDate(project.createdAt)}
          </p>
          {project.assignedTo ? (
            <Badge variant="outline" className="bg-green-50">
              Asignado a: {project.assignedTo.name || project.assignedTo.email}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50">
              Sin asignar
            </Badge>
          )}
        </div>
      </div>

      {canManageProject() && (
        <Button
          onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
        >
          Editar Proyecto
        </Button>
      )}
    </div>
  );

  const FilesList = () => (
    <ul className="divide-y">
      {project.files.map((file) => (
        <li key={file.id} className="py-3 flex justify-between items-center">
          <div>
            <p className="font-medium">{file.filename}</p>
            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFile(file)}
          >
            Descargar
          </Button>
        </li>
      ))}
    </ul>
  );

  // Componente principal
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <ProjectHeader />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              {project.description ? (
                <p className="whitespace-pre-line">{project.description}</p>
              ) : (
                <p className="text-gray-500 italic">Sin descripción</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Archivos</CardTitle>
            </CardHeader>
            <CardContent>
              {project.files.length > 0 ? (
                <FilesList />
              ) : (
                <p className="text-gray-500 italic">No hay archivos adjuntos</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Creado por
                  </h3>
                  <p>{project.createdBy.name || project.createdBy.email}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Fecha de creación
                  </h3>
                  <p>{getFormattedDate(project.createdAt)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Última actualización
                  </h3>
                  <p>{getFormattedDate(project.updatedAt)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                  <p>
                    {project.assignedTo
                      ? `Asignado a ${project.assignedTo.name || project.assignedTo.email}`
                      : "Sin asignar"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Archivos
                  </h3>
                  <p>{project.files.length} archivos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-10">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard/projects")}
            >
              Volver a proyectos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
