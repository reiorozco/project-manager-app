import { UploadedFile } from "@/app/projects/_utils/types";
import { Project } from "@prisma/client";

class ProjectService {
  async createProject(
    title: string,
    description: string = "",
    files: UploadedFile[] = [],
  ): Promise<Project> {
    try {
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
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el proyecto");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en createProject:", error);
      throw error;
    }
  }

  async getProject(projectId: string): Promise<Project> {
    try {
      // Ejemplo de implementación
      const response = await fetch(`/api/projects/${projectId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener el proyecto");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en getProject:", error);
      throw error;
    }
  }

  async getProjects(userId?: string): Promise<Project[]> {
    try {
      // Ejemplo de implementación
      const url = userId ? `/api/projects?userId=${userId}` : "/api/projects";
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener los proyectos");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en getProjects:", error);
      throw error;
    }
  }

  async updateProject(
    projectId: string,
    data: Partial<Pick<Project, "title" | "description">> & {
      files?: File[];
    },
  ): Promise<Project> {
    try {
      // Ejemplo de implementación
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el proyecto");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en updateProject:", error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      // Ejemplo de implementación
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar el proyecto");
      }
    } catch (error) {
      console.error("Error en deleteProject:", error);
      throw error;
    }
  }
}

// Exportar una instancia única del servicio
export const projectService = new ProjectService();
