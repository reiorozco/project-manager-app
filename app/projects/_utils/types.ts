import { z } from "zod";
import { File as PrismaFile, Prisma, Project } from "@/generated/prisma";

// Constantes para validación de archivos
export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes
export const BUCKET_NAME = "project-files";

// Esquema de validación para el formulario de proyecto
export const projectSchema = z.object({
  title: z
    .string()
    .min(3, { message: "El título debe tener al menos 3 caracteres" })
    .max(100, { message: "El título no puede exceder los 100 caracteres" }),
  description: z
    .string()
    .max(500, { message: "La descripción no puede exceder los 500 caracteres" })
    .optional(),
  assignedToId: z.string().optional().nullable(),
  files: z
    .array(z.instanceof(File))
    .max(MAX_FILES, {
      message: `Solo puedes seleccionar hasta ${MAX_FILES} archivos`,
    })
    .optional(),
});

// Tipo para los valores del formulario derivado del esquema
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

// Tipo para respuestas de error de la API
export interface ApiError {
  message: string;
  code?: string;
}
