import { UserRole } from "@prisma/client";

/**
 * Mapeo de roles de usuario a texto legible
 */
export const ROLE_DISPLAY_MAP: Record<UserRole, string> = {
  [UserRole.CLIENT]: "Cliente",
  [UserRole.PROJECT_MANAGER]: "Project Manager",
  [UserRole.DESIGNER]: "Diseñador",
};

export const ROLES_CAN_CREATE_PROJECTS = [
  UserRole.CLIENT,
  UserRole.PROJECT_MANAGER,
];

/**
 * Rutas de navegación comunes
 */
export const ROUTES = {
  DASHBOARD: "/",
  PROJECTS: "/projects",
  NEW_PROJECT: "/projects/new",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  PROJECT_DETAILS: (projectId: string) => `/projects/${projectId}`,
  EDIT_PROJECT: (projectId: string) => `/projects/${projectId}/edit`,
};
