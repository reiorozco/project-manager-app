"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/app/auth/auth-context";
import { UserRole } from "@prisma/client";

// Componentes
import {
  DeleteProjectDialog,
  EmptyState,
  ErrorState,
  ProjectsList,
} from "@/app/components/projects";
import { LoadingState } from "@/app/projects/_utils/utility-components";

// Hooks y tipos
import { useProjects } from "@/app/projects/_hooks/useProjects";
import { Project } from "@/app/projects/_utils/types";

export default function ProjectsPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();

  const { projects, loading, error, deleteProject } = useProjects();

  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete);
      setProjectToDelete(null);
    } catch (err) {
      console.log(
        "Error eliminando in deleteProject: ",
        err instanceof Error ? err.message : "",
      );
    }
  };

  // Permisos basados en rol
  const canCreateProject =
    userRole === UserRole.CLIENT || userRole === UserRole.PROJECT_MANAGER;
  const canManageProject = (project: Project) =>
    userRole === UserRole.PROJECT_MANAGER ||
    (userRole === UserRole.CLIENT && project.createdById === user?.id);

  // Renderizado condicional para diferentes estados
  if (loading) {
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
      />
    </div>
  );
}
