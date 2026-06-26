// lib/services/project-service.ts
import { Prisma, ProjectStatus, UserRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Types and interfaces
 */
export interface CreateProjectInput {
  title: string;
  description?: string;
  status?: ProjectStatus;
  dueDate?: string | Date | null;
  userId: string;
  files?: FileUpload[];
}

export interface FileUpload {
  filename: string;
  path: string;
  size: number;
}

export interface ProjectIncludeOptions {
  includeCreatedBy?: boolean;
  includeAssignedTo?: boolean;
  includeFiles?: boolean;
}

/**
 * Error handling
 */
export class ProjectServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectServiceError";
  }
}

/**
 * Helper functions
 */

/**
 * Standard project include object for Prisma queries
 * @param options - Options to customize the include object
 * @returns Prisma include object
 */
export function getProjectInclude(options: ProjectIncludeOptions = {}) {
  const {
    includeCreatedBy = true,
    includeAssignedTo = true,
    includeFiles = true,
  } = options;

  return {
    ...(includeCreatedBy && {
      createdBy: { select: { name: true, email: true } },
    }),
    ...(includeAssignedTo && {
      assignedTo: { select: { name: true, email: true } },
    }),
    ...(includeFiles && { files: true }),
  };
}

/**
 * User and permission functions
 */

/**
 * Get the role of a user
 * @param userId - The ID of the user
 * @returns The user's role or null if not found
 */
export async function getUserRole(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role || null;
}

/**
 * Check if a user can manage a project
 * @param userId - The ID of the user
 * @param projectId - The ID of the project
 * @returns Boolean indicating if the user can manage the project
 */
export async function canManageProject(userId: string, projectId: string) {
  const userRole = await getUserRole(userId);

  // Project Managers can manage any project
  if (userRole === UserRole.PROJECT_MANAGER) {
    return true;
  }

  // Clients can only manage their own projects
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true },
  });

  if (!project) {
    return false;
  }

  return project.createdById === userId;
}

/**
 * Check if a user can view a project
 * @param userId - The ID of the user
 * @param projectId - The ID of the project
 * @returns Boolean indicating if the user can view the project
 */
export async function canViewProject(userId: string, projectId: string) {
  const userRole = await getUserRole(userId);

  // Project Managers can view any project
  if (userRole === UserRole.PROJECT_MANAGER) {
    return true;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true, assignedToId: true },
  });

  if (!project) {
    return false;
  }

  // Clients can view their own projects
  if (project.createdById === userId) {
    return true;
  }

  // Designers can see projects assigned to them
  if (userRole === UserRole.DESIGNER && project.assignedToId === userId) {
    return true;
  }

  return false;
}

/**
 * Project retrieval functions
 */

/**
 * Get projects for a specific user based on their role
 * @param userId - The ID of the user
 * @returns Array of projects the user has access to
 */
export async function getProjectsForUser(userId: string) {
  const userRole = await getUserRole(userId);
  const include = getProjectInclude();
  const orderBy = { createdAt: "desc" as const };

  // Get projects based on user role
  return getProjectsByUserRole(userId, userRole, include, orderBy);
}

/**
 * Helper function to get projects based on user role
 * @param userId - The ID of the user
 * @param userRole - The role of the user
 * @param include - Prisma include object
 * @param orderBy - Prisma orderBy object
 * @returns Array of projects
 */
async function getProjectsByUserRole(
  userId: string,
  userRole: UserRole | null,
  include: Prisma.ProjectInclude,
  orderBy: Prisma.ProjectOrderByWithRelationInput,
) {
  switch (userRole) {
    case UserRole.PROJECT_MANAGER:
      // Project Managers can see all projects
      return prisma.project.findMany({
        include,
        orderBy,
      });

    case UserRole.DESIGNER:
      // Designers can see projects assigned to them
      return prisma.project.findMany({
        where: { assignedToId: userId },
        include,
        orderBy,
      });

    case UserRole.CLIENT:
    default:
      // Clients see only their own projects
      return prisma.project.findMany({
        where: { createdById: userId },
        include,
        orderBy,
      });
  }
}

/**
 * Get a project by ID if the user has permission to view it
 * @param projectId - The ID of the project
 * @param userId - The ID of the user
 * @returns The project or null if not found
 * @throws ProjectServiceError if the user doesn't have permission
 */
export async function getProjectById(projectId: string, userId: string) {
  const canView = await canViewProject(userId, projectId);

  if (!canView) {
    throw new ProjectServiceError(
      "You don't have permission to view this project",
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: getProjectInclude(),
  });

  if (!project) {
    throw new ProjectServiceError("Project not found");
  }

  return project;
}

/**
 * Project creation and modification functions
 */

/**
 * Check if a user can create projects
 * @param userId - The ID of the user
 * @returns Boolean indicating if the user can create projects
 */
async function canCreateProjects(userId: string): Promise<boolean> {
  const userRole = await getUserRole(userId);
  return userRole === UserRole.CLIENT || userRole === UserRole.PROJECT_MANAGER;
}

/**
 * Create file objects for Prisma create operation
 * @param files - Array of file uploads
 * @returns Prisma create object for files or undefined if no files
 */
function createFileObjects(files?: FileUpload[]) {
  if (!files || files.length === 0) {
    return undefined;
  }

  return {
    create: files.map((file) => ({
      filename: file.filename,
      path: file.path,
      size: file.size,
    })),
  };
}

/**
 * Create a new project
 * @param data - Project creation input data
 * @returns The created project
 * @throws ProjectServiceError if the user doesn't have permission
 */
export async function createProject(data: CreateProjectInput) {
  // Check if the user can create projects (clients or project managers only)
  const canCreate = await canCreateProjects(data.userId);

  if (!canCreate) {
    throw new ProjectServiceError(
      "You don't have permission to create projects",
    );
  }

  // Create the project with files
  return prisma.project.create({
    data: {
      title: data.title,
      description: data.description || "",
      status: data.status,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      createdBy: { connect: { id: data.userId } },
      files: createFileObjects(data.files),
    },
    include: getProjectInclude(),
  });
}

/**
 * Update project data interface
 */
export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  dueDate?: string | Date | null;
  assignedToId?: string | null;
  files?: FileUpload[];
}

/**
 * Create assignedTo object for Prisma update operation
 * @param assignedToId - ID of the user to assign or null to unassign
 * @returns Prisma update object for assignedTo or undefined if not changing
 */
function createAssignedToObject(assignedToId?: string | null) {
  if (assignedToId === undefined) {
    return undefined;
  }

  return assignedToId
    ? { connect: { id: assignedToId } }
    : { disconnect: true };
}

/**
 * Create update data object for Prisma
 * @param data - Update project input data
 * @returns Prisma update data object
 */
function createProjectUpdateData(data: UpdateProjectInput) {
  return {
    ...(data.title && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.dueDate !== undefined && {
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    }),
    ...(data.assignedToId !== undefined && {
      assignedTo: createAssignedToObject(data.assignedToId),
    }),
    files: createFileObjects(data.files),
  };
}

/**
 * Update a project
 * @param projectId - The ID of the project
 * @param userId - The ID of the user making the update
 * @param data - Project update input data
 * @returns The updated project
 * @throws ProjectServiceError if the user doesn't have permission
 */
export async function updateProject(
  projectId: string,
  userId: string,
  data: UpdateProjectInput,
) {
  const canManage = await canManageProject(userId, projectId);

  if (!canManage) {
    throw new ProjectServiceError(
      "You don't have permission to edit this project",
    );
  }

  const updateData = createProjectUpdateData(data);

  return prisma.project.update({
    where: { id: projectId },
    data: updateData,
    include: getProjectInclude(),
  });
}

/**
 * File operations
 */

/**
 * Delete files from Supabase storage
 * @param files - Array of file objects
 * @param supabaseAdmin - Supabase client with admin privileges
 */
async function deleteFilesFromStorage(
  files: { path: string }[],
  supabaseAdmin: SupabaseClient,
) {
  if (!files || files.length === 0) {
    return;
  }

  for (const file of files) {
    const path = file.path.replace("public/", "");
    await supabaseAdmin.storage.from("project-files").remove([path]);
  }
}

/**
 * Delete a project and its associated files
 * @param projectId - The ID of the project
 * @param userId - The ID of the user making the deletion
 * @param supabaseAdmin - Supabase client with admin privileges
 * @returns The deleted project
 * @throws ProjectServiceError if the user doesn't have permission
 */
export async function deleteProject(
  projectId: string,
  userId: string,
  supabaseAdmin: SupabaseClient,
) {
  const canManage = await canManageProject(userId, projectId);

  if (!canManage) {
    throw new ProjectServiceError(
      "You don't have permission to delete this project",
    );
  }

  // First, get the project files to delete them from storage
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { files: true },
  });

  if (!project) {
    throw new ProjectServiceError("Project not found");
  }

  // Delete files from Supabase storage
  await deleteFilesFromStorage(project.files, supabaseAdmin);

  // Delete project (and its related files thanks to onDelete: Cascade)
  return prisma.project.delete({
    where: { id: projectId },
  });
}

/**
 * Add files to an existing project
 * @param projectId - The ID of the project
 * @param userId - The ID of the user adding the files
 * @param files - Array of file uploads
 * @returns Result of the file creation operation
 * @throws ProjectServiceError if the user doesn't have permission
 */
export async function addFilesToProject(
  projectId: string,
  userId: string,
  files: FileUpload[],
) {
  const canManage = await canManageProject(userId, projectId);

  if (!canManage) {
    throw new ProjectServiceError(
      "You don't have permission to edit this project",
    );
  }

  if (!files || files.length === 0) {
    throw new ProjectServiceError("No files were provided to add");
  }

  return prisma.file.createMany({
    data: files.map((file) => ({
      filename: file.filename,
      path: file.path,
      size: file.size,
      projectId,
    })),
  });
}

/**
 * Remove a file from a project and delete it from storage
 * @param fileId - The ID of the file
 * @param userId - The ID of the user removing the file
 * @param supabaseAdmin - Supabase client with admin privileges
 * @returns The deleted file
 * @throws ProjectServiceError if the user doesn't have permission or file not found
 */
export async function removeFileFromProject(
  fileId: string,
  userId: string,
  supabaseAdmin: SupabaseClient,
) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: { project: true },
  });

  if (!file) {
    throw new ProjectServiceError("File not found");
  }

  const canManage = await canManageProject(userId, file.project.id);

  if (!canManage) {
    throw new ProjectServiceError(
      "You don't have permission to delete this file",
    );
  }

  // Delete file from Supabase storage
  const path = file.path.replace("public/", "");
  await supabaseAdmin.storage.from("project-files").remove([path]);

  // Delete reference in the database
  return prisma.file.delete({
    where: { id: fileId },
  });
}

/**
 * User management functions
 */

/**
 * Get all designers in the system
 * @returns Array of designers with basic information
 */
export async function getDesigners() {
  return prisma.user.findMany({
    where: { role: UserRole.DESIGNER },
    select: { id: true, name: true, email: true },
  });
}
