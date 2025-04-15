import React from "react";
import Link from "next/link";
import { Folder, FolderPlus } from "lucide-react";
import { ROLES_CAN_CREATE_PROJECTS, ROUTES } from "@/lib/constants";
import { UserRole } from "@prisma/client";
import ActionButton from "@/app/components/ActionButton";

type SearchElement = "CLIENT" | "PROJECT_MANAGER";

interface Props {
  userRole: UserRole;
}

function QuickActions({ userRole }: Props) {
  const canCreateProjects = ROLES_CAN_CREATE_PROJECTS.includes(
    userRole as SearchElement,
  );

  return (
    <div className="mt-12 bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-3">Acciones rápidas</h2>
      <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-around flex-wrap items-center">
        <Link href={ROUTES.PROJECTS}>
          <ActionButton icon={<Folder />} label="Ver todos los proyectos" />
        </Link>

        {/* Botón para crear nuevo proyecto (solo visible para roles específicos) */}
        {canCreateProjects && (
          <Link href={ROUTES.NEW_PROJECT}>
            <ActionButton
              icon={<FolderPlus />}
              label="Crear nuevo proyecto"
              variant="outline"
            />
          </Link>
        )}
      </div>
    </div>
  );
}

export default QuickActions;
