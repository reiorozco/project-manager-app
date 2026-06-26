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
    "Oversee, assign and move your team's projects forward.",
  [UserRole.CLIENT]: "Create projects and track their progress in one place.",
  [UserRole.DESIGNER]: "Review your assigned projects and deliver on time.",
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
            Dashboard
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
            Create project
          </Link>
        </Button>
      )}
    </header>
  );
}

export default DashboardHeader;
