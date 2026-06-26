import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  File as PrismaFile,
  Project,
  ProjectStatus,
  UserRole,
} from "@/generated/prisma";
import { useAuth } from "@/app/auth/auth-context";
import { BUCKET_NAME, ProjectWithRelations } from "@/app/projects/_utils/types";
import { projectService } from "@/app/projects/_utils/projectService";

export const useProjectDetails = (projectId: string) => {
  const { user, userRole, supabase } = useAuth();
  const queryClient = useQueryClient();

  // Project query
  const { data, isLoading, error, refetch } = useQuery<{
    project: ProjectWithRelations;
  }>({
    queryKey: ["project", projectId],
    queryFn: async () => await projectService.getProject(projectId),
    enabled: !!projectId, // Only run when there is a projectId
  });

  // Function to check permissions
  const canManageProject = (project: Project) =>
    userRole === UserRole.PROJECT_MANAGER ||
    (userRole === UserRole.CLIENT && project.createdById === user?.id);

  // Whether the current user can change this project's status at all
  const canUpdateStatus = (project: Project) =>
    canManageProject(project) ||
    (userRole === UserRole.DESIGNER && project.assignedToId === user?.id);

  // Status targets the current user is allowed to set. Marking a project as
  // DONE (final sign-off) is reserved for managers and the client creator.
  const allowedStatusTargets = (project: Project): ProjectStatus[] => {
    if (canManageProject(project)) {
      return [
        ProjectStatus.DRAFT,
        ProjectStatus.IN_PROGRESS,
        ProjectStatus.REVIEW,
        ProjectStatus.DONE,
      ];
    }
    if (userRole === UserRole.DESIGNER && project.assignedToId === user?.id) {
      return [ProjectStatus.IN_PROGRESS, ProjectStatus.REVIEW];
    }
    return [];
  };

  // Mutation to update the project status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: ProjectStatus) =>
      await projectService.updateStatus(projectId, status),
    onSuccess: (result) => {
      queryClient.setQueryData(["project", projectId], result);
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateStatus = async (status: ProjectStatus): Promise<void> => {
    await updateStatusMutation.mutateAsync(status);
  };

  // Mutation to download files
  const downloadFileMutation = useMutation({
    mutationFn: async (file: PrismaFile): Promise<void> => {
      const { data, error: downloadError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(file.path);

      if (downloadError) throw downloadError;

      // Create a blob URL and simulate a click to download
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();

      // Clean up resources
      URL.revokeObjectURL(url);
      a.remove();
    },
  });

  // Simplified function for external use
  const downloadFile = async (file: PrismaFile): Promise<void> => {
    await downloadFileMutation.mutateAsync(file);
  };

  return {
    project: data ? data.project : null,
    loading: isLoading,
    error:
      error instanceof Error ? error.message : error ? String(error) : null,
    canManageProject,
    canUpdateStatus,
    allowedStatusTargets,
    updateStatus,
    isUpdatingStatus: updateStatusMutation.isPending,
    statusError:
      updateStatusMutation.error instanceof Error
        ? updateStatusMutation.error.message
        : null,
    downloadFile,
    isDownloading: downloadFileMutation.isPending,
    downloadError: downloadFileMutation.error,
    refetchProject: refetch,
  };
};
