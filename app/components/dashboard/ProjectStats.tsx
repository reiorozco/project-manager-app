import React from "react";
import { Folders, Users, Settings2 } from "lucide-react";
import { Project } from "@/generated/prisma";
import { getProjectsForUser } from "@/lib/services/project-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatCard } from "@/app/components/dashboard";

async function ProjectStats({ userId }: { userId: string }) {
  const projects = await getProjectsForUser(userId);
  const stats = {
    total: projects.length,
    assigned: projects.filter((p: Project) => p.assignedToId !== null).length,
    unassigned: projects.filter((p: Project) => p.assignedToId === null).length,
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Resumen de proyectos</h2>

      {!projects ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudieron cargar las estadísticas. Por favor, intente
            nuevamente.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Proyectos totales"
            value={stats.total}
            icon={<Folders />}
          />

          <StatCard
            title="Proyectos asignados"
            value={stats.assigned}
            icon={<Users />}
          />

          <StatCard
            title="Proyectos sin asignar"
            value={stats.unassigned}
            icon={<Settings2 />}
          />
        </div>
      )}
    </div>
  );
}

export default ProjectStats;
