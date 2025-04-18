"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/auth-context";
import { ROUTES } from "@/lib/constants";
import { UserRole } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Componentes
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProjectForm } from "@/app/components/form/ProjectForm";

import { useProjectSubmission } from "@/app/projects/_hooks/useProjectSubmission";
import { useProjectDetails } from "@/app/projects/_hooks/useProjectDetails";

interface ProjectParams {
  params: Promise<{ id: string }>;
}

export default function EditProjectPage({ params }: ProjectParams) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;
  const { userRole } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    project,
    loading: projectLoading,
    error: projectError,
    canManageProject,
  } = useProjectDetails(projectId);

  // Consulta para cargar los diseñadores (solo si es PROJECT_MANAGER)
  const {
    data: designers = [],
    isLoading: designersLoading,
    error: designersError,
  } = useQuery({
    queryKey: ["designers"],
    queryFn: async () => {
      const response = await fetch("/api/users/designers");
      if (!response.ok) {
        throw new Error("Error al cargar los diseñadores");
      }
      const data = await response.json();
      return data.designers;
    },
    enabled: userRole === UserRole.PROJECT_MANAGER, // Solo ejecutar si es PROJECT_MANAGER
  });

  // Hook para manejar la lógica de envío
  const {
    handleUpdateSubmit,
    isSubmitting,
    error: submitError,
  } = useProjectSubmission();

  // Mutación para eliminar archivo
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(
        `/api/projects/${projectId}/files/${fileId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el archivo");
      }

      return fileId;
    },
    onSuccess: () => {
      // Invalidar la consulta del proyecto para recargar los datos
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  // Manejar la eliminación de archivos
  const handleDeleteFile = (fileId: string) => {
    deleteFileMutation.mutate(fileId);
  };

  // Estado de carga
  const isLoading =
    projectLoading ||
    (userRole === UserRole.PROJECT_MANAGER && designersLoading);
  if (isLoading) {
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
  const loadError =
    projectError ||
    (userRole === UserRole.PROJECT_MANAGER && designersError instanceof Error
      ? designersError
      : null);
  if (loadError || !project || !canManageProject(project)) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            {loadError instanceof Error
              ? loadError.message
              : typeof loadError === "string"
                ? loadError
                : "Proyecto no encontrado o no tienes permiso para editarlo."}
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
        isSubmitting={isSubmitting || deleteFileMutation.isPending}
        error={
          submitError ||
          (deleteFileMutation.error instanceof Error
            ? deleteFileMutation.error.message
            : null)
        }
        onCancel={() => router.push(ROUTES.PROJECT_DETAILS(projectId))}
        isEditMode={true}
        designers={designers}
        canAssignToDesigner={userRole === UserRole.PROJECT_MANAGER}
      />
    </div>
  );
}
