"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from "@prisma/client";
import { useAuth } from "@/app/auth/auth-context";

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      active: pathname === "/dashboard",
      visible: true,
    },
    {
      name: "Proyectos",
      href: "/dashboard/projects",
      active: pathname.startsWith("/dashboard/projects"),
      visible: true,
    },
  ];

  const handleSignOut = async () => {
    router.push("/auth/login");
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegación superior */}
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                {/* Logo */}
                <Link
                  href="/dashboard"
                  className="font-bold text-xl text-blue-600"
                >
                  Grayola
                </Link>
              </div>

              {/* Links de navegación en desktop */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation
                  .filter((item) => item.visible)
                  .map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        item.active
                          ? "border-b-2 border-blue-500 text-gray-900"
                          : "border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
              </div>
            </div>

            {/* Acciones de usuario */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="relative ml-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center">
                      <span className="mr-2">{user?.email?.split("@")[0]}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="10" r="3" />
                        <path d="M7 20.662V19c0-1.657 2.239-3 5-3s5 1.343 5 3v1.662" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user?.email}</span>
                        <span className="text-xs text-gray-500">
                          {userRole === UserRole.CLIENT && "Cliente"}
                          {userRole === UserRole.PROJECT_MANAGER &&
                            "Project Manager"}
                          {userRole === UserRole.DESIGNER && "Diseñador"}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Botón para móvil */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Abrir menú principal</span>
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation
                .filter((item) => item.visible)
                .map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block py-2 pl-3 pr-4 text-base font-medium ${
                      item.active
                        ? "bg-blue-50 border-l-4 border-blue-500 text-blue-700"
                        : "border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
            </div>
            <div className="border-t border-gray-200 pb-3 pt-4">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user?.email?.split("@")[0]}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleSignOut}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 w-full text-left"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Contenido principal */}
      <main className="py-6">{children}</main>
    </div>
  );
}
