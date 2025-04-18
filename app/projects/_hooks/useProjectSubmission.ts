import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth/auth-context";
import { FileUploadService } from "@/lib/services/fileUploadService";
import { projectService } from "@/app/projects/_utils/projectService";
import {
  ProjectFormValues,
  ProjectWithRelations,
} from "@/app/projects/_utils/types";
import { ROUTES } from "@/lib/constants";
import { useRouter } from "next/navigation";

interface UseProjectSubmissionProps {
  onSuccess?: (project?: ProjectWithRelations) => void;
  onError?: (error: string) => void;
}

export function useProjectSubmission({
  onSuccess,
  onError,
}: UseProjectSubmissionProps = {}) {
  const { user, supabase } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const fileUploadService = new FileUploadService(supabase);

  // Mutación para crear un proyecto
  const createProjectMutation = useMutation({
    mutationFn: async ({
      values,
      files,
    }: {
      values: ProjectFormValues;
      files: File[];
    }) => {
      if (!user) {
        throw new Error("No se pudo crear el proyecto: Usuario no autenticado");
      }

      // 1. Subir archivos (si existen)
      const uploadedFiles = await fileUploadService.uploadMultipleFiles(
        files,
        user.id,
      );

      // 2. Crear el proyecto con los archivos subidos
      return await projectService.createProject(
        values.title,
        values.description || "",
        uploadedFiles,
      );
    },
    onSuccess: (data) => {
      // Actualizar consulta de proyectos
      queryClient.setQueryData<{ projects: ProjectWithRelations[] }>(
        ["projects", user?.id],
        (old) => {
          const oldProjects = old?.projects ?? [];

          return {
            projects: [data?.project, ...oldProjects],
          };
        },
      );

      router.push(ROUTES.PROJECTS);

      onSuccess?.(data?.project);
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Error al crear el proyecto";
      onError?.(errorMessage);
    },
  });

  // Mutación para actualizar un proyecto
  const updateProjectMutation = useMutation({
    mutationFn: async ({
      values,
      files,
      projectId,
    }: {
      values: ProjectFormValues;
      files: File[];
      projectId: string;
    }) => {
      if (!user) {
        throw new Error(
          "No se pudo actualizar el proyecto: Usuario no autenticado",
        );
      }

      if (!projectId) {
        throw new Error(
          "No se pudo actualizar el proyecto: ProjectId no definido",
        );
      }

      // 1. Subir archivos (si existen)
      const uploadedFiles = await fileUploadService.uploadMultipleFiles(
        files,
        user.id,
      );

      // 2. Actualizar el proyecto con los archivos subidos
      return await projectService.updateProject(projectId, {
        title: values.title,
        description: values.description || "",
        assignedToId:
          values.assignedToId === "sin-asignar" ? null : values.assignedToId,
        files: uploadedFiles,
      });
    },
    onSuccess: (data) => {
      // Actualizar consultas de proyectos y la del proyecto específico
      queryClient.setQueryData<{ projects: ProjectWithRelations[] }>(
        ["projects", user?.id],
        (old) => {
          if (!old) return { projects: [] };

          const updatedProjects = old.projects.map((p) =>
            p.id === data?.project?.id ? data?.project : p,
          );

          return { projects: updatedProjects };
        },
      );
      queryClient.setQueryData<{ project: ProjectWithRelations }>(
        ["project", data?.project?.id],
        () => ({
          project: data?.project,
        }),
      );

      router.push(ROUTES.PROJECT_DETAILS(data?.project?.id));

      onSuccess?.(data?.project);
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Error al actualizar el proyecto";
      onError?.(errorMessage);
    },
  });

  const handleSubmit = (values: ProjectFormValues, files: File[]) => {
    createProjectMutation.mutate({ values, files });
  };

  const handleUpdateSubmit = (
    values: ProjectFormValues,
    newFiles: File[],
    projectId?: string,
  ) => {
    if (!projectId) {
      const errorMessage =
        "No se pudo actualizar el proyecto: ProjectId no definido";
      onError?.(errorMessage);
      return;
    }

    updateProjectMutation.mutate({ values, files: newFiles, projectId });
  };

  return {
    handleSubmit,
    handleUpdateSubmit,
    isSubmitting:
      createProjectMutation.isPending || updateProjectMutation.isPending,
    error:
      createProjectMutation.error?.message ||
      updateProjectMutation.error?.message ||
      null,

    createProjectMutation,
    updateProjectMutation,
    resetMutations: () => {
      createProjectMutation.reset();
      updateProjectMutation.reset();
    },
  };
}
