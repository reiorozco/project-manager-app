import React from "react";
import { Folders, UserCheck, CircleDashed } from "lucide-react";
import { getProjectsForUser } from "@/lib/services/project-service";
import { StatCard } from "@/app/components/dashboard";

type DashboardProject = Awaited<ReturnType<typeof getProjectsForUser>>[number];

function ProjectStats({ projects }: { projects: DashboardProject[] }) {
  const stats = {
    total: projects.length,
    assigned: projects.filter((p) => p.assignedToId !== null).length,
    unassigned: projects.filter((p) => p.assignedToId === null).length,
  };

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Overview
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total projects"
          value={stats.total}
          icon={<Folders />}
          accent
        />
        <StatCard
          title="Assigned"
          value={stats.assigned}
          icon={<UserCheck />}
        />
        <StatCard
          title="Unassigned"
          value={stats.unassigned}
          icon={<CircleDashed />}
        />
      </div>
    </section>
  );
}

export default ProjectStats;
