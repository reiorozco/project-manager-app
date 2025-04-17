import { SupabaseClient } from "@supabase/supabase-js";
import { BUCKET_NAME, PrismaFilePreview } from "@/app/projects/_utils/types";

export class FileUploadService {
  constructor(private supabase: SupabaseClient) {}

  async uploadFile(file: File, userId: string): Promise<PrismaFilePreview> {
    try {
      const filePath = `projects/${userId}/${Date.now()}-${file.name}`;

      // Subir el archivo a Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (error) throw new Error(`Error al subir archivo: ${error.message}`);
      if (!data) throw new Error("No se obtuvo respuesta del servidor");

      // Obtener URL pública del archivo
      // const { data: urlData } = this.supabase.storage
      //   .from("project-files")
      //   .getPublicUrl(filePath);

      return {
        filename: file.name,
        path: data.path,
        size: file.size,
      };
    } catch (error) {
      console.error("Error en uploadFile:", error);
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: File[],
    userId: string,
  ): Promise<PrismaFilePreview[]> {
    try {
      if (!files.length) return [];

      // Subir cada archivo de forma concurrente
      const uploadPromises = files.map((file) => this.uploadFile(file, userId));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Error en uploadMultipleFiles:", error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) throw new Error(`Error al eliminar archivo: ${error.message}`);
    } catch (error) {
      console.error("Error en deleteFile:", error);
      throw error;
    }
  }

  async deleteMultipleFiles(filePaths: string[]): Promise<void> {
    try {
      if (!filePaths.length) return;

      const { error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

      if (error)
        throw new Error(`Error al eliminar archivos: ${error.message}`);
    } catch (error) {
      console.error("Error en deleteMultipleFiles:", error);
      throw error;
    }
  }
}
