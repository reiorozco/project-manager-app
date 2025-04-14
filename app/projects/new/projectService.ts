import { UploadedFile } from "./types";

export const projectService = {
  async createProject(
    title: string,
    description: string,
    files: UploadedFile[],
  ): Promise<void> {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        files,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Error al crear el proyecto");
    }
  },
};
