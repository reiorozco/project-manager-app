"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

// Componentes
import {
  DeleteProjectDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  ProjectsList,
} from "@/app/components/projects";

import { useProjects } from "@/app/projects/_hooks/useProjects";

export default function ProjectsPage() {
  const router = useRouter();
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const {
    projects,
    isLoading,
    error,
    deleteProject,
    isDeleting,
    canCreateProject,
    canManageProject,
  } = useProjects();

  const handleDeleteConfirm = () => {
    if (!projectToDelete) return;

    deleteProject(projectToDelete, {
      onSuccess: () => {
        setProjectToDelete(null);
      },
    });
  };

  // Renderizado condicional para diferentes estados
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Proyectos</h1>

        {canCreateProject && (
          <Button onClick={() => router.push(ROUTES.NEW_PROJECT)}>
            Nuevo Proyecto
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState canCreateProject={canCreateProject} />
      ) : (
        <ProjectsList
          projects={projects}
          canManageProject={canManageProject}
          onDelete={setProjectToDelete}
          router={router}
        />
      )}

      <DeleteProjectDialog
        isOpen={!!projectToDelete || isDeleting}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
