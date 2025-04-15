import React from "react";
import { UserRole } from "@prisma/client";
import { ROLE_DISPLAY_MAP } from "@/lib/constants";

interface Props {
  userRole: UserRole;
}

function DashboardHeader({ userRole }: Props) {
  // Obtener el texto del rol del usuario desde el mapa constante
  const roleText = ROLE_DISPLAY_MAP[userRole];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-12 md:px-12 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          Bienvenido a Project Manager
        </h1>

        <p className="mt-3 text-xl text-gray-500">
          Panel de gestión de proyectos de diseño
        </p>

        <div className="mt-2 text-sm text-gray-500">
          Estás conectado como <strong>{roleText}</strong>
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader;
