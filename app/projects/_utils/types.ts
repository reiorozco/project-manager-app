import { z } from "zod";
import {
  File as PrismaFile,
  Prisma,
  Project,
  ProjectStatus,
} from "@/generated/prisma";

// Constants for file validation
export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const BUCKET_NAME = "project-files";

// Validation schema for the project form
export const projectSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100, { message: "Title cannot exceed 100 characters" }),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
  status: z.nativeEnum(ProjectStatus),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  files: z
    .array(z.instanceof(File))
    .max(MAX_FILES, {
      message: `You can select up to ${MAX_FILES} files`,
    })
    .optional(),
});

// Type for the form values derived from the schema
export type ProjectFormValues = z.infer<typeof projectSchema>;

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    files: true;
    assignedTo: true;
    createdBy: true;
  };
}>;

export type PrismaFilePreview = Pick<PrismaFile, "filename" | "path" | "size">;
export type ProjectPreview = Pick<
  Project,
  "title" | "description" | "assignedToId"
>;

// Type for API error responses
export interface ApiError {
  message: string;
  code?: string;
}
