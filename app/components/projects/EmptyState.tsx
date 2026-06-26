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
        <h2 className="text-lg font-semibold">No projects yet</h2>
        <p className="text-sm text-muted-foreground">
          {canCreateProject
            ? "Create your first project to start organizing briefs, files and progress in one place."
            : "When a project is assigned to you, it will show up here."}
        </p>
      </div>

      {canCreateProject && (
        <Button asChild>
          <Link href={ROUTES.NEW_PROJECT}>
            <FolderPlus className="size-4" />
            Create project
          </Link>
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
