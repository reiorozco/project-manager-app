import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Project } from "@prisma/client";
import { ROUTES } from "@/lib/constants";
import { ProjectCard } from "@/app/components/projects";
import { ProjectWithRelations } from "@/app/projects/_utils/types";

interface ProjectsListProps {
  projects: ProjectWithRelations[];
  canManageProject: (project: Project) => boolean;
  onDelete: (projectId: string) => void;
  router: AppRouterInstance;
}

function ProjectsList({
  projects,
  canManageProject,
  onDelete,
  router,
}: ProjectsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          canManage={canManageProject(project)}
          onDelete={onDelete}
          onViewDetails={() => router.push(ROUTES.PROJECT_DETAILS(project.id))}
          onEdit={() => router.push(ROUTES.EDIT_PROJECT(project.id))}
        />
      ))}
    </div>
  );
}

export default ProjectsList;
