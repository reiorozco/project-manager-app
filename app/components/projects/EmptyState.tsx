import Link from "next/link";
import { FolderPlus, FolderOpen } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

function EmptyState({ canCreateProject }: { canCreateProject: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FolderOpen className="size-7" />
      </div>

      <div className="max-w-sm space-y-1">
        <h2 className="text-lg font-semibold">Aún no hay proyectos</h2>
        <p className="text-sm text-muted-foreground">
          {canCreateProject
            ? "Crea tu primer proyecto para empezar a organizar briefs, archivos y avances en un solo lugar."
            : "Cuando se te asigne un proyecto, aparecerá aquí."}
        </p>
      </div>

      {canCreateProject && (
        <Button asChild>
          <Link href={ROUTES.NEW_PROJECT}>
            <FolderPlus className="size-4" />
            Crear proyecto
          </Link>
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
