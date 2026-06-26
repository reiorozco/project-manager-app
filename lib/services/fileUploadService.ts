import { SupabaseClient } from "@supabase/supabase-js";
import { BUCKET_NAME, PrismaFilePreview } from "@/app/projects/_utils/types";

export class FileUploadService {
  constructor(private supabase: SupabaseClient) {}

  async uploadFile(file: File, userId: string): Promise<PrismaFilePreview> {
    try {
      const filePath = `projects/${userId}/${Date.now()}-${file.name}`;

      // Upload the file to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (error) throw new Error(`Failed to upload file: ${error.message}`);
      if (!data) throw new Error("No response from the server");

      // Get the file's public URL
      // const { data: urlData } = this.supabase.storage
      //   .from("project-files")
      //   .getPublicUrl(filePath);

      return {
        filename: file.name,
        path: data.path,
        size: file.size,
      };
    } catch (error) {
      console.error("Error in uploadFile:", error);
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: File[],
    userId: string,
  ): Promise<PrismaFilePreview[]> {
    try {
      if (!files.length) return [];

      // Upload each file concurrently
      const uploadPromises = files.map((file) => this.uploadFile(file, userId));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Error in uploadMultipleFiles:", error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) throw new Error(`Failed to delete file: ${error.message}`);
    } catch (error) {
      console.error("Error in deleteFile:", error);
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
        throw new Error(`Failed to delete files: ${error.message}`);
    } catch (error) {
      console.error("Error in deleteMultipleFiles:", error);
      throw error;
    }
  }
}
