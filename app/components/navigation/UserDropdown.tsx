import { User } from "@supabase/supabase-js";
import { UserRole } from "@prisma/client";
import { CircleUser } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Loading from "@/app/components/Loading";

export default function UserDropdown({
  user,
  userRole,
  onSignOut,
}: {
  user: User | null;
  userRole: UserRole | null;
  onSignOut: () => Promise<void>;
}) {
  // Función auxiliar para mostrar el rol en texto legible
  const getRoleDisplay = (role: UserRole | null) => {
    if (!role) return "";

    switch (role) {
      case UserRole.CLIENT:
        return "Cliente";
      case UserRole.PROJECT_MANAGER:
        return "Project Manager";
      case UserRole.DESIGNER:
        return "Diseñador";
      default:
        return "";
    }
  };

  return (
    <div className="relative ml-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center">
            {user?.email ? (
              <span>{user?.email?.split("@")[0]}</span>
            ) : (
              <Loading />
            )}

            <CircleUser size="15rem" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user?.email}</span>

              <span className="text-xs text-gray-500">
                {getRoleDisplay(userRole)}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onSignOut}>Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
