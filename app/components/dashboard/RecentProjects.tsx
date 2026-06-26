import React from "react";
import Link from "next/link";
import { ChevronRight, FileText, FolderOpen } from "lucide-react";
import { getProjectsForUser } from "@/lib/services/project-service";
import { ROUTES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge from "@/app/components/projects/StatusBadge";

type DashboardProject = Awaited<ReturnType<typeof getProjectsForUser>>[number];

function initials(value: string) {
  return value
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProjectRow({ project }: { project: DashboardProject }) {
  const assignee = project.assignedTo?.name || project.assignedTo?.email;

  return (
    <Link
      href={ROUTES.PROJECT_DETAILS(project.id)}
      className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{project.title}</p>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3" />
            {project.files.length}
          </span>
          <span className="truncate">
            {assignee ? `Assigned to ${assignee}` : "Unassigned"}
          </span>
        </div>
      </div>

      <StatusBadge status={project.status} className="hidden sm:inline-flex" />

      {assignee ? (
        <Avatar className="size-7">
          <AvatarFallback className="text-[10px]">
            {initials(assignee)}
          </AvatarFallback>
        </Avatar>
      ) : null}

      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function RecentProjects({ projects }: { projects: DashboardProject[] }) {
  const recent = projects.slice(0, 5);

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent projects
        </h2>
        {projects.length > 0 && (
          <Link
            href={ROUTES.PROJECTS}
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="p-2">
          {recent.length > 0 ? (
            <div className="divide-y divide-border/60">
              {recent.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <FolderOpen className="size-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No projects yet. Create your first one to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default RecentProjects;
