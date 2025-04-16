import { useState } from "react";
import { useAuth } from "@/app/auth/auth-context";
import { FileUploadService } from "@/lib/services/fileUploadService";
import { projectService } from "@/app/projects/_utils/projectService";
import { ProjectFormValues } from "@/app/projects/_utils/types";

interface UseProjectSubmissionProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useProjectSubmission({
  onSuccess,
  onError,
}: UseProjectSubmissionProps = {}) {
  const { user, supabase } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instancia del servicio de carga de archivos
  const fileUploadService = new FileUploadService(supabase);

  const handleSubmit = async (values: ProjectFormValues, files: File[]) => {
    // Verificar autenticación
    if (!user) {
      const errorMessage =
        "No se pudo crear el proyecto: Usuario no autenticado";
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Subir archivos (si existen)
      const uploadedFiles = await fileUploadService.uploadMultipleFiles(
        files,
        user.id,
      );

      // 2. Crear el proyecto con los archivos subidos
      await projectService.createProject(
        values.title,
        values.description || "",
        uploadedFiles,
      );

      // 3. Ejecutar callback de éxito si existe
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear el proyecto";

      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    error,
    setError,
  };
}
