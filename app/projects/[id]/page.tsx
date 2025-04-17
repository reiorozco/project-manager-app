"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Project, UserRole, File as PrismaFile } from "@prisma/client";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/app/auth/auth-context";
import { BUCKET_NAME, ProjectWithRelations } from "@/app/projects/_utils/types";
import { projectService } from "@/app/projects/_utils/projectService";
import { formatFileSize } from "@/app/projects/_utils/formatFileSize";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: Props) {
  // Desenvolver params con React.use() según nueva API de Next.js
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;

  // Hooks y estado
  const router = useRouter();
  const { user, userRole, supabase } = useAuth();
  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del proyecto
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { project } = await projectService.getProject(projectId);

        setProject(project);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el proyecto",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchProject();
  }, [projectId]);

  // Funciones auxiliares
  const canManageProject = (project: Project) =>
    userRole === UserRole.PROJECT_MANAGER ||
    (userRole === UserRole.CLIENT && project.createdById === user?.id);

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

  const downloadFile = async (file: PrismaFile): Promise<void> => {
    try {
      const { data, error: downloadError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(file.path);

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
            onClick={() => router.push(ROUTES.PROJECTS)}
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
            onClick={() => router.push(ROUTES.PROJECTS)}
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
            Creado: {getFormattedDate(project.createdAt.toString())}
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

      {canManageProject(project) && (
        <Button onClick={() => router.push(ROUTES.EDIT_PROJECT(projectId))}>
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
                  <p>{getFormattedDate(project.createdAt.toString())}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Última actualización
                  </h3>
                  <p>{getFormattedDate(project.createdAt.toString())}</p>
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
              onClick={() => router.push(ROUTES.PROJECTS)}
            >
              Volver a proyectos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
