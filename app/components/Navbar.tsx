"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import { useAuth } from "@/app/auth/auth-context";
import NavLogo from "@/app/components/navigation/NavLogo";
import DesktopNavigation from "@/app/components/navigation/DesktopNavigation";
import MobileNavigation from "@/app/components/navigation/MobileNavigation";
import UserDropdown from "@/app/components/navigation/UserDropdown";

export function Navbar() {
  const router = useRouter();
  const { user, userRole, signOut } = useAuth();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Definición de enlaces de navegación
  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      active: pathname === "/",
      visible: true,
    },
    {
      name: "Proyectos",
      href: "/projects",
      active: pathname.startsWith("/projects"),
      visible: true,
    },
  ];

  const handleSignOut = async () => {
    router.push("/auth/login");
    await signOut();
  };

  // Filtrar solo los elementos visibles para el usuario actual
  const visibleNavItems = navigation.filter((item) => item.visible);

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 justify-between">
          <div className="flex">
            <NavLogo />

            {/* Links de navegación en desktop */}
            <DesktopNavigation navItems={visibleNavItems} />
          </div>

          {/* Componentes para escritorio y móvil */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <UserDropdown
              user={user}
              userRole={userRole}
              onSignOut={handleSignOut}
            />
          </div>

          {/* Botón de hamburguesa para móvil */}
          <MobileMenuButton
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </div>
      </div>

      {/* Menú móvil */}
      {isMobileMenuOpen && (
        <MobileNavigation
          navItems={visibleNavItems}
          user={user}
          onClose={() => setIsMobileMenuOpen(false)}
          onSignOut={handleSignOut}
        />
      )}
    </nav>
  );
}

/**
 * Componente para el botón de menú en móvil
 */
function MobileMenuButton({
  onClick,
}: {
  onClick: () => void;
  isOpen?: boolean;
}) {
  return (
    <div className="flex items-center sm:hidden">
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
        onClick={onClick}
      >
        <span className="sr-only">Abrir menú principal</span>

        <Menu />
      </button>
    </div>
  );
}
