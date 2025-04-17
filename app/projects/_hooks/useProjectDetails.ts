import { useMutation, useQuery } from "@tanstack/react-query";
import { File as PrismaFile, Project, UserRole } from "@prisma/client";
import { useAuth } from "@/app/auth/auth-context";
import { BUCKET_NAME, ProjectWithRelations } from "@/app/projects/_utils/types";
import { projectService } from "@/app/projects/_utils/projectService";

export const useProjectDetails = (projectId: string) => {
  const { user, userRole, supabase } = useAuth();

  // Consulta del proyecto
  const { data, isLoading, error, refetch } = useQuery<{
    project: ProjectWithRelations;
  }>({
    queryKey: ["project", projectId],
    queryFn: async () => await projectService.getProject(projectId),
    enabled: !!projectId, // Solo ejecutar si hay un projectId
  });

  // Función para verificar permisos
  const canManageProject = (project: Project) =>
    userRole === UserRole.PROJECT_MANAGER ||
    (userRole === UserRole.CLIENT && project.createdById === user?.id);

  // Mutación para descargar archivos
  const downloadFileMutation = useMutation({
    mutationFn: async (file: PrismaFile): Promise<void> => {
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
    },
  });

  // Función simplificada para uso externo
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
