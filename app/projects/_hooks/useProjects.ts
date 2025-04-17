import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Project, UserRole } from "@prisma/client";
import { useAuth } from "@/app/auth/auth-context";
import { ProjectWithRelations } from "@/app/projects/_utils/types";
import { projectService } from "@/app/projects/_utils/projectService";

interface DeleteProjectOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useProjects() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  // Obtener todos los proyectos
  const { data, isLoading, error, refetch } = useQuery<
    { projects: ProjectWithRelations[] },
    Error
  >({
    queryKey: ["projects"],
    queryFn: async () => await projectService.getProjects(),
  });

  // Eliminar un proyecto
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) =>
      await projectService.deleteProject(projectId),

    onSuccess: (deletedProjectId) => {
      // Actualizar la lista de proyectos en caché
      queryClient.setQueryData<{ projects: ProjectWithRelations[] }>(
        ["projects"],
        (old) => {
          if (!old) return { projects: [] };

          return {
            projects: old.projects.filter((p) => p.id !== deletedProjectId),
          };
        },
      );

      // Invalidar posibles queries relacionadas
      void queryClient.invalidateQueries({
        queryKey: ["project", deletedProjectId],
      });
    },
  });

  // Función para eliminar un proyecto con opciones de callback
  const deleteProject = (projectId: string, options?: DeleteProjectOptions) => {
    deleteProjectMutation.mutate(projectId, {
      onSuccess: () => {
        options?.onSuccess?.();
      },
      onError: (error) => {
        options?.onError?.(
          error instanceof Error ? error.message : String(error),
        );
      },
    });
  };

  // Permisos basados en rol
  const canCreateProject =
    userRole === UserRole.CLIENT || userRole === UserRole.PROJECT_MANAGER;

  const canManageProject = (project: Project) =>
    userRole === UserRole.PROJECT_MANAGER ||
    (userRole === UserRole.CLIENT && project.createdById === user?.id);

  return {
    projects: data ? data.projects : [],
    isLoading,
    error:
      error instanceof Error ? error.message : error ? String(error) : null,
    deleteProject,
    isDeleting: deleteProjectMutation.isPending,
    refetchProjects: refetch,
    canCreateProject,
    canManageProject,
  };
}
