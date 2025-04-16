import { BUCKET_NAME, UploadedFile } from "./types";
import { useAuth } from "@/app/auth/auth-context";
import { SupabaseClient } from "@supabase/supabase-js";

// Clase que recibe el cliente Supabase como dependencia
export class FileUploadService {
  constructor(private supabaseClient: SupabaseClient) {}

  async uploadFile(file: File, userId: string): Promise<UploadedFile> {
    const fileExt = file.name.split(".").pop();
    const randomName = Math.random().toString(36).substring(2, 15);
    const fileName = `${randomName}.${fileExt}`;
    const filePath = `projects/${userId}/${fileName}`;

    // Subir archivo
    const { data: uploadData, error: uploadError } =
      await this.supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

    if (uploadError) {
      throw new Error(
        `Error al subir el archivo ${file.name}: ${uploadError.message}`,
      );
    }

    // Obtener URL pública
    const { data: urlData } = this.supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      filename: file.name,
      path: filePath,
      size: file.size,
      url: urlData.publicUrl,
    };
  }

  async uploadMultipleFiles(
    files: File[],
    userId: string,
  ): Promise<UploadedFile[]> {
    if (files.length === 0) return [];

    // Subir archivos en paralelo para mayor eficiencia
    const uploadPromises = files.map((file) => this.uploadFile(file, userId));

    // Esperar a que todos los archivos se suban
    const results = await Promise.allSettled(uploadPromises);

    // Procesar resultados
    const uploadedFiles: UploadedFile[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        uploadedFiles.push(result.value);
      } else {
        // Si algún archivo falla, lanzar error
        throw new Error(
          `Error al subir el archivo ${files[index].name}: ${result.reason}`,
        );
      }
    });

    return uploadedFiles;
  }
}

// Hook que proporciona el servicio ya configurado con el cliente Supabase centralizado
export function useFileUploadService() {
  const { supabase } = useAuth();
  return new FileUploadService(supabase);
}
