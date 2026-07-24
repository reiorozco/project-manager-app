import { upload } from "@vercel/blob/client";
import { del } from "@vercel/blob";
import { PrismaFilePreview } from "@/app/projects/_utils/types";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export class FileUploadService {
  async uploadFile(
    file: File,
    userId: string,
    projectId: string,
    fileId: string,
  ): Promise<PrismaFilePreview> {
    const pathname = `projects/${userId}/${fileId}-${sanitizeFilename(file.name)}`;

    const blob = await upload(pathname, file, {
      access: "private",
      handleUploadUrl: "/api/upload",
      multipart: file.size > 5_000_000,
    });

    return {
      filename: file.name,
      path: blob.pathname,
      size: file.size,
    };
  }

  async uploadMultipleFiles(
    files: File[],
    userId: string,
    projectId: string,
  ): Promise<PrismaFilePreview[]> {
    if (!files.length) return [];
    return await Promise.all(
      files.map((file) =>
        this.uploadFile(file, userId, projectId, crypto.randomUUID()),
      ),
    );
  }

  async deleteFile(filePath: string): Promise<void> {
    await del(filePath);
  }

  async deleteMultipleFiles(filePaths: string[]): Promise<void> {
    if (!filePaths.length) return;
    await Promise.all(filePaths.map((path) => del(path)));
  }
}
