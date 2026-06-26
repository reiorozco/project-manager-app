import React from "react";
import Link from "next/link";
import { FolderPlus } from "lucide-react";
import { UserRole } from "@/generated/prisma";
import {
  ROLE_DISPLAY_MAP,
  ROLES_CAN_CREATE_PROJECTS,
  ROUTES,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  userRole: UserRole;
}

const ROLE_SUBTITLE: Record<UserRole, string> = {
  [UserRole.PROJECT_MANAGER]:
    "Supervisa, asigna y haz avanzar los proyectos del equipo.",
  [UserRole.CLIENT]: "Crea proyectos y sigue su avance en un solo lugar.",
  [UserRole.DESIGNER]: "Revisa los proyectos asignados y entrégalos a tiempo.",
};

function DashboardHeader({ userRole }: Props) {
  const roleText = ROLE_DISPLAY_MAP[userRole];
  const canCreate = ROLES_CAN_CREATE_PROJECTS.includes(
    userRole as "CLIENT" | "PROJECT_MANAGER",
  );

  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Panel
          </h1>
          <Badge variant="secondary" className="font-medium">
            {roleText}
          </Badge>
        </div>
        <p className="text-muted-foreground">{ROLE_SUBTITLE[userRole]}</p>
      </div>

      {canCreate && (
        <Button asChild>
          <Link href={ROUTES.NEW_PROJECT}>
            <FolderPlus className="h-4 w-4" />
            Crear proyecto
          </Link>
        </Button>
      )}
    </header>
  );
}

export default DashboardHeader;
