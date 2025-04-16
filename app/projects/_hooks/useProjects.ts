import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/app/projects/_utils/types";

export function useProjects() {
  const queryClient = useQueryClient();

  // Query para obtener todos los proyectos
  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery<Project[], Error>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");

      if (!response.ok) {
        throw new Error("Error al cargar los proyectos");
      }

      const data = await response.json();
      return data.projects;
    },
  });

  // Mutation para eliminar un proyecto
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el proyecto");
      }

      return projectId;
    },
    // Actualizar caché al eliminar proyecto
    onSuccess: (deletedProjectId) => {
      // Actualizar la lista de proyectos en caché
      queryClient.setQueryData<Project[]>(["projects"], (oldProjects) =>
        oldProjects ? oldProjects.filter((p) => p.id !== deletedProjectId) : [],
      );

      // Invalidar posibles queries relacionadas
      void queryClient.invalidateQueries({ queryKey: ["project-details"] });
    },
  });

  return {
    projects,
    isLoading,
    error: error ? error.message : null,
    deleteProject: deleteProjectMutation.mutate,
    isDeleting: deleteProjectMutation.isPending,
    deleteError: deleteProjectMutation.error?.message || null,
  };
}
