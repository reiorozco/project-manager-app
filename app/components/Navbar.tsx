"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, Folders, Home, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/app/auth/auth-context";
import { ROLE_DISPLAY_MAP, ROUTES } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Navbar() {
  const { user, userRole, signOut, isSigningOut } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();

      router.push(ROUTES.LOGIN);
    } catch (error) {
      console.error("Unexpected error during logout:", error);
    }
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={user ? ROUTES.DASHBOARD : "/"}
            className="font-bold text-xl"
          >
            <div className="flex flex-shrink-0 items-center gap-2">
              <Folders size="2rem" className="text-blue-600" />
              Project-Manager
            </div>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              disabled={isSigningOut}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href={ROUTES.DASHBOARD}>
                  <Button
                    variant="ghost"
                    className="flex gap-2"
                    disabled={isSigningOut}
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href={ROUTES.PROJECTS}>
                  <Button
                    variant="ghost"
                    className="flex gap-2"
                    disabled={isSigningOut}
                  >
                    <FolderKanban className="h-4 w-4" />
                    Proyectos
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="ml-4 gap-2"
                      disabled={isSigningOut}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      {user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>Mi cuenta</span>
                        {userRole && (
                          <Badge variant="outline" className="mt-1 w-fit">
                            {ROLE_DISPLAY_MAP[userRole]}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>
                        {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href={ROUTES.LOGIN}>
                  <Button variant="ghost">Iniciar sesión</Button>
                </Link>
                <Link href={ROUTES.REGISTER}>
                  <Button>Registrarse</Button>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-3 border-t">
            {user ? (
              <>
                <div className="px-2 pt-2 pb-3 space-y-2">
                  <div className="flex items-center gap-3 p-2 mb-2">
                    <Avatar>
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      {userRole && (
                        <Badge variant="outline" className="mt-1">
                          {ROLE_DISPLAY_MAP[userRole]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <Link
                    href={ROUTES.DASHBOARD}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      disabled={isSigningOut}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link
                    href={ROUTES.PROJECTS}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      disabled={isSigningOut}
                    >
                      <FolderKanban className="mr-2 h-4 w-4" />
                      Proyectos
                    </Button>
                  </Link>
                  <Separator className="my-2" />
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="px-2 pt-2 pb-3 space-y-2">
                <Link href={ROUTES.LOGIN} onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button className="w-full">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
