// lib/services/project-service.ts

// import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { SupabaseClient } from "@supabase/supabase-js";

export interface CreateProjectInput {
  title: string;
  description?: string;
  userId: string;
  files?: FileUpload[];
}

export interface FileUpload {
  filename: string;
  path: string;
  size: number;
}

export async function getUserRole(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role || null;
}

export async function canManageProject(userId: string, projectId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Project Managers can manage any project
  if (user?.role === UserRole.PROJECT_MANAGER) {
    return true;
  }

  // Clients can only manage their own projects
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true },
  });

  return project?.createdById === userId;
}

export async function canViewProject(userId: string, projectId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Project Managers can view any project
  if (user?.role === UserRole.PROJECT_MANAGER) {
    return true;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true, assignedToId: true },
  });

  // Clients can view their own projects
  if (project?.createdById === userId) {
    return true;
  }

  // Designers can see projects assigned to them
  if (user?.role === UserRole.DESIGNER && project?.assignedToId === userId) {
    return true;
  }

  return false;
}

export async function getProjectsForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Depending on the role, we get different projects
  switch (user?.role) {
    case UserRole.PROJECT_MANAGER:
      // Project Managers can see all projects
      return prisma.project.findMany({
        include: {
          createdBy: { select: { name: true, email: true } },
          assignedTo: { select: { name: true, email: true } },
          files: true,
        },
        orderBy: { createdAt: "desc" },
      });

    case UserRole.DESIGNER:
      // Designers can see projects assigned to them
      return prisma.project.findMany({
        where: { assignedToId: userId },
        include: {
          createdBy: { select: { name: true, email: true } },
          assignedTo: { select: { name: true, email: true } },
          files: true,
        },
        orderBy: { createdAt: "desc" },
      });

    case UserRole.CLIENT:
    default:
      // Clients see only their own projects
      return prisma.project.findMany({
        where: { createdById: userId },
        include: {
          createdBy: { select: { name: true, email: true } },
          assignedTo: { select: { name: true, email: true } },
          files: true,
        },
        orderBy: { createdAt: "desc" },
      });
  }
}

export async function getProjectById(projectId: string, userId: string) {
  const canView = await canViewProject(userId, projectId);

  if (!canView) {
    throw new Error("No tienes permiso para ver este proyecto");
  }

  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      createdBy: { select: { name: true, email: true } },
      assignedTo: { select: { name: true, email: true } },
      files: true,
    },
  });
}

export async function createProject(data: CreateProjectInput) {
  // Check if the user can create projects (clients or project managers only)
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { role: true },
  });

  if (
    user?.role !== UserRole.CLIENT &&
    user?.role !== UserRole.PROJECT_MANAGER
  ) {
    throw new Error("No tienes permiso para crear proyectos");
  }

  // Create the project with files
  return prisma.project.create({
    data: {
      title: data.title,
      description: data.description || "",
      createdBy: { connect: { id: data.userId } },
      files: data.files
        ? {
            create: data.files.map((file) => ({
              filename: file.filename,
              path: file.path,
              size: file.size,
            })),
          }
        : undefined,
    },
    include: {
      createdBy: { select: { name: true, email: true } },
      assignedTo: { select: { name: true, email: true } },
      files: true,
    },
  });
}

export async function updateProject(
  projectId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    assignedToId?: string | null;
    files?: FileUpload[];
  },
) {
  const canManage = await canManageProject(userId, projectId);

  if (!canManage) {
    throw new Error("No tienes permiso para editar este proyecto");
  }

  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.assignedToId !== undefined && {
        assignedTo: data.assignedToId
          ? { connect: { id: data.assignedToId } }
          : { disconnect: true },
      }),
      files: data.files
        ? {
            create: data.files.map((file) => ({
              filename: file.filename,
              path: file.path,
              size: file.size,
            })),
          }
        : undefined,
    },
    include: {
      createdBy: { select: { name: true, email: true } },
      assignedTo: { select: { name: true, email: true } },
      files: true,
    },
  });
}

export async function deleteProject(
  projectId: string,
  userId: string,
  supabaseAdmin: SupabaseClient,
) {
  // const supabaseAdmin = await createClient();
  const canManage = await canManageProject(userId, projectId);

  if (!canManage) {
    throw new Error("No tienes permiso para eliminar este proyecto");
  }

  // First, we get the project files to delete them from the storage
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { files: true },
  });

  if (project?.files.length) {
    // Delete files from Supabase storage
    for (const file of project.files) {
      const path = file.path.replace("public/", "");
      await supabaseAdmin.storage.from("project-files").remove([path]);
    }
  }

  // Delete project (and its related files thanks to onDelete: Cascade)
  return prisma.project.delete({
    where: { id: projectId },
  });
}

export async function addFilesToProject(
  projectId: string,
  userId: string,
  files: FileUpload[],
) {
  const canManage = await canManageProject(userId, projectId);

  if (!canManage) {
    throw new Error("No tienes permiso para editar este proyecto");
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

export async function removeFileFromProject(
  fileId: string,
  userId: string,
  supabaseAdmin: SupabaseClient,
) {
  // const supabaseAdmin = await createClient();

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: { project: true },
  });

  if (!file) {
    throw new Error("Archivo no encontrado");
  }

  const canManage = await canManageProject(userId, file.project.id);

  if (!canManage) {
    throw new Error("No tienes permiso para eliminar este archivo");
  }

  // Eliminar archivo del storage de Supabase
  const path = file.path.replace("public/", "");
  await supabaseAdmin.storage.from("project-files").remove([path]);

  // Eliminar referencia en la base de datos
  return prisma.file.delete({
    where: { id: fileId },
  });
}

export async function getDesigners() {
  return prisma.user.findMany({
    where: { role: UserRole.DESIGNER },
    select: { id: true, name: true, email: true },
  });
}
