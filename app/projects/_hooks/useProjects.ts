import { useState, useEffect } from "react";
import { Project } from "@/app/projects/_utils/types";

type ProjectsState = {
  projects: Project[];
  loading: boolean;
  error: string | null;
};

type ProjectsActions = {
  deleteProject: (projectId: string) => Promise<void>;
};

export function useProjects(): ProjectsState & ProjectsActions {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar proyectos al iniciar
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const response = await fetch("/api/projects");

        if (!response.ok) {
          throw new Error("Error al cargar los proyectos");
        }

        const data = await response.json();
        setProjects(data.projects);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar los proyectos",
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchProjects();
  }, []);

  // Función para eliminar un proyecto
  const deleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el proyecto");
      }

      // Actualizar lista de proyectos
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar el proyecto",
      );
      throw err; // Propagar el error para que el componente pueda manejarlo
    }
  };

  return {
    projects,
    loading,
    error,
    deleteProject,
  };
}
