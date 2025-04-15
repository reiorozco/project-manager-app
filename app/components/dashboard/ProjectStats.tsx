import React from "react";
import StatsCard from "@/app/components/dashboard/StatsCard";
import { Project } from "@/generated/prisma";
import { getProjectsForUser } from "@/lib/services/project-service";

async function ProjectStats({ userId }: { userId: string }) {
  const projects = await getProjectsForUser(userId);
  const stats = {
    total: projects.length,
    assigned: projects.filter((p: Project) => p.assignedToId !== null).length,
    unassigned: projects.filter((p: Project) => p.assignedToId === null).length,
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Resumen de proyectos</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Totales" value={stats.total} />

        <StatsCard title="Asignados" value={stats.assigned} />

        <StatsCard title="Sin asignar" value={stats.unassigned} />
      </div>
    </div>
  );
}

export default ProjectStats;
