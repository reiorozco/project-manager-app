import React from "react";
import { UserRole } from "@/generated/prisma";
import { ROLE_DISPLAY_MAP } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  userRole: UserRole;
}

function DashboardHeader({ userRole }: Props) {
  // Obtener el texto del rol del usuario desde el mapa constante
  const roleText = ROLE_DISPLAY_MAP[userRole];

  return (
    <Card className="border-none shadow-md">
      <CardContent className="px-6 py-10 md:px-12 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Bienvenido a Project Manager
        </h1>

        <p className="mt-3 text-xl text-gray-500">
          Panel de gestión de proyectos de diseño
        </p>

        <div className="mt-4 flex items-center justify-center md:justify-start">
          <span className="text-sm text-gray-500 mr-2">
            Estás conectado como
          </span>

          <Badge variant="outline" className="font-medium">
            {roleText}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardHeader;
