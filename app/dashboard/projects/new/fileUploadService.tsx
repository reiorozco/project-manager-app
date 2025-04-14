import { createClient } from "@/lib/supabase/client";
import { BUCKET_NAME, UploadedFile } from "./types";

export const fileUploadService = {
  async uploadFile(file: File, userId: string): Promise<UploadedFile> {
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const randomName = Math.random().toString(36).substring(2, 15);
    const fileName = `${randomName}.${fileExt}`;
    const filePath = `projects/${userId}/${fileName}`;

    // Subir archivo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(
        `Error al subir el archivo ${file.name}: ${uploadError.message}`,
      );
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      filename: file.name,
      path: filePath,
      size: file.size,
      url: urlData.publicUrl,
    };
  },

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
  },
};
