import React from "react";
import Link from "next/link";
import { Folder, FolderPlus } from "lucide-react";
import { ROLES_CAN_CREATE_PROJECTS, ROUTES } from "@/lib/constants";
import { UserRole } from "@prisma/client";
import ActionButton from "@/app/components/ActionButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SearchElement = "CLIENT" | "PROJECT_MANAGER";

interface Props {
  userRole: UserRole;
}

function QuickActions({ userRole }: Props) {
  const canCreateProjects = ROLES_CAN_CREATE_PROJECTS.includes(
    userRole as SearchElement,
  );

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Acciones rápidas</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 justify-items-center gap-4">
          <Link href={ROUTES.PROJECTS}>
            <ActionButton
              label="Ver todos los proyectos"
              icon={<Folder className="h-6 w-6 mb-1" />}
              variant="default"
            />
          </Link>

          {canCreateProjects && (
            <Link href={ROUTES.NEW_PROJECT}>
              <ActionButton
                icon={<FolderPlus className="h-6 w-6 mb-1" />}
                label="Crear nuevo proyecto"
                variant="outline"
              />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActions;
