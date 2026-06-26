import { ProjectStatus, UserRole } from "@/generated/prisma";

/**
 * Mapeo de roles de usuario a texto legible
 */
export const ROLE_DISPLAY_MAP: Record<UserRole, string> = {
  [UserRole.CLIENT]: "Cliente",
  [UserRole.PROJECT_MANAGER]: "Project Manager",
  [UserRole.DESIGNER]: "Diseñador",
};

/**
 * Estados del ciclo de vida del proyecto, en orden de avance
 */
export const STATUS_DISPLAY_MAP: Record<ProjectStatus, string> = {
  [ProjectStatus.DRAFT]: "Borrador",
  [ProjectStatus.IN_PROGRESS]: "En progreso",
  [ProjectStatus.REVIEW]: "En revisión",
  [ProjectStatus.DONE]: "Completado",
};

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  ProjectStatus.DRAFT,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.REVIEW,
  ProjectStatus.DONE,
];

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
