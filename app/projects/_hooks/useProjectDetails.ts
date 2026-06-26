import { useMutation, useQuery } from "@tanstack/react-query";
import { File as PrismaFile, Project, UserRole } from "@/generated/prisma";
import { useAuth } from "@/app/auth/auth-context";
import { BUCKET_NAME, ProjectWithRelations } from "@/app/projects/_utils/types";
import { projectService } from "@/app/projects/_utils/projectService";

export const useProjectDetails = (projectId: string) => {
  const { user, userRole, supabase } = useAuth();

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
    downloadFile,
    isDownloading: downloadFileMutation.isPending,
    downloadError: downloadFileMutation.error,
    refetchProject: refetch,
  };
};
