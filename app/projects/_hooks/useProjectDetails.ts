import { useEffect, useState } from "react";
import { File as PrismaFile, Project, UserRole } from "@prisma/client";
import { useAuth } from "@/app/auth/auth-context";
import { BUCKET_NAME, ProjectWithRelations } from "@/app/projects/_utils/types";
import { projectService } from "@/app/projects/_utils/projectService";

export const useProjectDetails = (projectId: string) => {
  const { user, userRole, supabase } = useAuth();
  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const canManageProject = (project: Project) =>
    userRole === UserRole.PROJECT_MANAGER ||
    (userRole === UserRole.CLIENT && project.createdById === user?.id);

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

  return {
    project,
    loading,
    error,
    canManageProject,
    downloadFile,
  };
};
