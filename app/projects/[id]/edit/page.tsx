"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/auth-context";
import { ROUTES } from "@/lib/constants";
import { User, UserRole } from "@prisma/client";

// Componentes
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProjectForm } from "@/app/components/form/ProjectForm";

import { useProjectSubmission } from "@/app/projects/_hooks/useProjectSubmission";
import { ProjectWithRelations } from "@/app/projects/_utils/types";
import { projectService } from "@/app/projects/_utils/projectService";

interface ProjectParams {
  params: Promise<{ id: string }>;
}

export default function EditProjectPage({ params }: ProjectParams) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;
  const { userRole } = useAuth();
  const router = useRouter();

  // Estados para manejar la carga de datos
  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [designers, setDesigners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Hook para manejar la lógica de envío
  const {
    handleUpdateSubmit,
    isSubmitting,
    error: submitError,
    setError,
  } = useProjectSubmission({
    onSuccess: () => {
      router.push(ROUTES.PROJECT_DETAILS(projectId));
      router.refresh();
    },
  });

  // Cargar datos del proyecto y diseñadores (si aplica)
  useEffect(() => {
    async function loadProjectData() {
      try {
        const { project } = await projectService.getProject(projectId);

        setProject(project);

        // Cargar diseñadores (solo para project managers)
        if (userRole === UserRole.PROJECT_MANAGER) {
          const designersResponse = await fetch("/api/users/designers");

          if (designersResponse.ok) {
            const designersData = await designersResponse.json();
            setDesigners(designersData.designers);
          } else {
            console.error("Error al cargar los diseñadores");
          }
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setLoadError(
          err instanceof Error ? err.message : "Error al cargar el proyecto",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProjectData();
  }, [projectId, userRole]);

  // Manejar la eliminación de archivos
  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/files/${fileId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el archivo");
      }

      // Actualizar el proyecto con los archivos actualizados
      setProject((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          files: prev.files.filter((file) => file.id !== fileId),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar el archivo",
      );
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Error de carga
  if (loadError || !project) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            {loadError || "Proyecto no encontrado"}
          </AlertDescription>
        </Alert>

        <Button
          onClick={() => router.push(ROUTES.PROJECTS)}
          className="mt-4"
          variant="outline"
        >
          Volver a proyectos
        </Button>
      </div>
    );
  }

  const initialValues = {
    title: project.title,
    description: project.description || "",
    assignedToId: project.assignedToId || "",
  };

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <ProjectForm
        initialValues={initialValues}
        existingFiles={project.files}
        projectId={projectId}
        onSubmit={handleUpdateSubmit}
        onDeleteFile={handleDeleteFile}
        isSubmitting={isSubmitting}
        error={submitError}
        onCancel={() => router.push(ROUTES.PROJECT_DETAILS(projectId))}
        isEditMode={true}
        designers={designers}
        canAssignToDesigner={userRole === UserRole.PROJECT_MANAGER}
      />
    </div>
  );
}
