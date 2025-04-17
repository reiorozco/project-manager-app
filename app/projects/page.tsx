"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/app/auth/auth-context";
import { Project, UserRole } from "@prisma/client";

// Componentes
import {
  DeleteProjectDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  ProjectsList,
} from "@/app/components/projects";

// Hooks y tipos
import { useProjects } from "@/app/projects/_hooks/useProjects";

export default function ProjectsPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();

  const { projects, isLoading, error, deleteProject, isDeleting } =
    useProjects();

  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (!projectToDelete) return;

    deleteProject(projectToDelete, {
      onSuccess: () => {
        setProjectToDelete(null);
      },
    });
  };

  // Permisos basados en rol
  const canCreateProject =
    userRole === UserRole.CLIENT || userRole === UserRole.PROJECT_MANAGER;
  const canManageProject = (project: Project) =>
    userRole === UserRole.PROJECT_MANAGER ||
    (userRole === UserRole.CLIENT && project.createdById === user?.id);

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
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
