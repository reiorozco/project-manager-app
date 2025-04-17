import { Project } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/app/projects/_utils/projectService";
import { ProjectWithRelations } from "@/app/projects/_utils/types";

export function useProjects() {
  const queryClient = useQueryClient();

  // Obtener todos los proyectos
  const { data, isLoading, error } = useQuery<
    { projects: ProjectWithRelations[] },
    Error
  >({
    queryKey: ["projects"],
    queryFn: async () => await projectService.getProjects(),
  });

  // Eliminar un proyecto
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) =>
      await projectService.deleteProject(projectId),

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
    projects: data ? data.projects : [],
    isLoading,
    error: error ? error.message : null,
    deleteProject: deleteProjectMutation.mutate,
    isDeleting: deleteProjectMutation.isPending,
    deleteError: deleteProjectMutation.error?.message || null,
  };
}
