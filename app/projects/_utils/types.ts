import { z } from "zod";

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
  files: z
    .array(z.instanceof(File))
    .max(MAX_FILES, {
      message: `Solo puedes seleccionar hasta ${MAX_FILES} archivos`,
    })
    .optional(),
});

// Tipo para los valores del formulario derivado del esquema
export type ProjectFormValues = z.infer<typeof projectSchema>;

// Tipo para archivos subidos (resultado del servicio de carga)
export interface UploadedFile {
  id: string;
  filename: string;
  path: string;
  size: number;
  type: string;
  url: string;
}

// Interfaces compartidas para el módulo de proyectos
export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assignedToId: string | null;
  createdBy: {
    name: string | null;
    email: string;
  };
  assignedTo: {
    name: string | null;
    email: string;
  } | null;
  files: {
    id: string;
    filename: string;
    path: string;
    size: number;
  }[];
}

// Tipo para los permisos de usuario sobre un proyecto
export type ProjectPermissions = {
  canManageProject: (project: Project) => boolean;
};
