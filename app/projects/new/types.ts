import { z } from "zod";

// Constantes
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES = 3; // Máximo número de archivos permitidos
export const BUCKET_NAME = "project-files";

export const projectSchema = z.object({
  title: z
    .string()
    .min(3, { message: "El título debe tener al menos 3 caracteres" }),
  description: z.string().optional(),
  files: z.array(z.instanceof(File)).optional(),
});

// Tipo para los datos del formulario
export type ProjectFormValues = z.infer<typeof projectSchema>;

// Tipo para los archivos procesados
export type UploadedFile = {
  filename: string;
  path: string;
  size: number;
  url: string;
};
