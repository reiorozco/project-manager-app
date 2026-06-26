import { ProjectStatus } from "@/generated/prisma";
import {
  PrismaFilePreview,
  ProjectPreview,
  ProjectWithRelations,
} from "@/app/projects/_utils/types";

interface CreateProjectArgs {
  title: string;
  description?: string;
  status?: ProjectStatus;
  dueDate?: string | null;
  files?: PrismaFilePreview[];
}

class ProjectService {
  async createProject({
    title,
    description = "",
    status,
    dueDate,
    files = [],
  }: CreateProjectArgs): Promise<{ project: ProjectWithRelations }> {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          status,
          dueDate,
          files,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create the project");
      }

      return await response.json();
    } catch (error) {
      console.error("Error in createProject:", error);
      throw error;
    }
  }

  async getProject(
    projectId: string,
  ): Promise<{ project: ProjectWithRelations }> {
    try {
      const response = await fetch(`/api/projects/${projectId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to load the project");
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getProject:", error);
      throw error;
    }
  }

  async getProjects(
    userId?: string,
  ): Promise<{ projects: ProjectWithRelations[] }> {
    try {
      const url = userId ? `/api/projects?userId=${userId}` : "/api/projects";
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to load projects");
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getProjects:", error);
      throw error;
    }
  }

  async updateProject(
    projectId: string,
    data: Partial<ProjectPreview> & {
      status?: ProjectStatus;
      dueDate?: string | null;
      files?: PrismaFilePreview[];
    },
  ): Promise<{ project: ProjectWithRelations }> {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update the project");
      }

      return await response.json();
    } catch (error) {
      console.error("Error in updateProject:", error);
      throw error;
    }
  }

  async updateStatus(
    projectId: string,
    status: ProjectStatus,
  ): Promise<{ project: ProjectWithRelations }> {
    try {
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            "Failed to update the status",
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error in updateStatus:", error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<string> {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete the project");
      }

      return projectId;
    } catch (error) {
      console.error("Error in deleteProject:", error);
      throw error;
    }
  }
}

// Export a single service instance
export const projectService = new ProjectService();
