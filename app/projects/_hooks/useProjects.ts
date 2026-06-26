import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Project, UserRole } from "@/generated/prisma";
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

  // Get all projects
  const {
    data,
    isLoading: isLoadingQuery,
    isFetching,
    isFetched,
    error,
    refetch,
  } = useQuery<{ projects: ProjectWithRelations[] }, Error>({
    queryKey: ["projects", user?.id],
    queryFn: async () => await projectService.getProjects(),
    enabled: !!user,
  });

  // Delete a project
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) =>
      await projectService.deleteProject(projectId),

    onSuccess: (deletedProjectId) => {
      // Update the cached project list
      queryClient.setQueryData<{ projects: ProjectWithRelations[] }>(
        ["projects", user?.id],
        (old) => {
          if (!old) return { projects: [] };

          return {
            projects: old.projects.filter((p) => p.id !== deletedProjectId),
          };
        },
      );

      // Invalidate any related queries
      void queryClient.invalidateQueries({
        queryKey: ["project", deletedProjectId],
      });
    },
  });

  // Function to delete a project with callback options
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

  // Role-based permissions
  const canCreateProject =
    userRole === UserRole.CLIENT || userRole === UserRole.PROJECT_MANAGER;

  const canManageProject = (project: Project) =>
    userRole === UserRole.PROJECT_MANAGER ||
    (userRole === UserRole.CLIENT && project.createdById === user?.id);

  const isLoading =
    isLoadingQuery ||
    (isFetching && (!data || data.projects.length === 0)) ||
    !isFetched;

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
