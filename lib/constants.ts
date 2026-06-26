import { ProjectStatus, UserRole } from "@/generated/prisma";

/**
 * Maps user roles to human-readable text
 */
export const ROLE_DISPLAY_MAP: Record<UserRole, string> = {
  [UserRole.CLIENT]: "Client",
  [UserRole.PROJECT_MANAGER]: "Project Manager",
  [UserRole.DESIGNER]: "Designer",
};

/**
 * Project lifecycle statuses, in order of progress
 */
export const STATUS_DISPLAY_MAP: Record<ProjectStatus, string> = {
  [ProjectStatus.DRAFT]: "Draft",
  [ProjectStatus.IN_PROGRESS]: "In progress",
  [ProjectStatus.REVIEW]: "In review",
  [ProjectStatus.DONE]: "Done",
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
 * Common navigation routes
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
