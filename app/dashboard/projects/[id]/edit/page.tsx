"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserRole } from "@prisma/client";
import { useAuth } from "@/app/auth/auth-context";
import { createClient } from "@/lib/supabase/client";

interface ProjectParams {
  params: Promise<{ id: string }>;
}

interface Designer {
  id: string;
  name: string | null;
  email: string;
}

interface File {
  id: string;
  filename: string;
  path: string;
  size: number;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assignedToId: string | null;
  createdBy: {
    name: string | null;
    email: string;
  };
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  files: File[];
}

const projectSchema = z.object({
  title: z
    .string()
    .min(3, { message: "El título debe tener al menos 3 caracteres" }),
  description: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  files: z.array(z.instanceof(File)).optional(),
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function EditProjectPage({ params }: ProjectParams) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newFiles, setNewFiles] = useState<FileList | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const supabase = createClient();

  // Verificar si el usuario puede editar proyectos
  const canAssignToDesigner = userRole === UserRole.PROJECT_MANAGER;

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedToId: null,
      files: [],
    },
  });

  // Cargar el proyecto
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          throw new Error("Error al cargar el proyecto");
        }

        const data = await response.json();
        setProject(data.project);

        // Inicializar el formulario con los datos del proyecto
        form.reset({
          title: data.project.title,
          description: data.project.description || "",
          assignedToId: data.project.assignedToId || null,
        });

        setSelectedFiles(data.project.files || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el proyecto",
        );
      }
    };

    const fetchDesigners = async () => {
      if (userRole === UserRole.PROJECT_MANAGER) {
        try {
          const response = await fetch("/api/users/designers");

          if (!response.ok) {
            throw new Error("Error al cargar los diseñadores");
          }

          const data = await response.json();
          setDesigners(data.designers);
        } catch (err) {
          console.error(
            "Error al cargar diseñadores:",
            err instanceof Error && err.message,
          );
        }
      }
    };

    Promise.all([fetchProject(), fetchDesigners()]).finally(() =>
      setLoading(false),
    );
  }, [projectId, form, userRole]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) return;

    // Validar tamaño de archivos
    const oversizedFiles = Array.from(files).filter(
      (file) => file.size > MAX_FILE_SIZE,
    );
    if (oversizedFiles.length > 0) {
      setError(
        `Algunos archivos exceden el tamaño máximo de 10MB: ${oversizedFiles.map((f) => f.name).join(", ")}`,
      );
      return;
    }

    setNewFiles(files);
  };

  const handleDeleteFile = async (fileId: string) => {
    setFileToDelete(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/files/${fileId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el archivo");
      }

      // Actualizar la lista de archivos
      setSelectedFiles(selectedFiles.filter((file) => file.id !== fileId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el archivo",
      );
    }
  };

  const onSubmit = async (values: z.infer<typeof projectSchema>) => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Subir nuevos archivos a Supabase Storage si existen
      const uploadedFiles = [];

      if (newFiles && newFiles.length > 0) {
        for (const file of Array.from(newFiles)) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `projects/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("project-files")
            .upload(filePath, file);

          if (uploadError) {
            throw new Error(
              `Error al subir el archivo ${file.name}: ${uploadError.message}`,
            );
          }

          // Obtener URL pública
          const {
            data: { publicUrl },
          } = supabase.storage.from("project-files").getPublicUrl(filePath);

          uploadedFiles.push({
            filename: file.name,
            path: `public/${filePath}`,
            size: file.size,
          });
        }

        // Añadir archivos al proyecto
        if (uploadedFiles.length > 0) {
          const filesResponse = await fetch(
            `/api/projects/${projectId}/files`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                files: uploadedFiles,
              }),
            },
          );

          if (!filesResponse.ok) {
            const data = await filesResponse.json();
            throw new Error(data.error || "Error al subir archivos");
          }
        }
      }

      // 2. Actualizar el proyecto
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description || "",
          assignedToId:
            values.assignedToId === "Sin asignar" ? "" : values.assignedToId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el proyecto");
      }

      // Redireccionar a la página de detalles
      router.push(`/dashboard/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir archivos");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Cargando proyecto...
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <div className="p-6 bg-red-50 text-red-600 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <Button
            onClick={() => router.push("/dashboard/projects")}
            className="mt-4"
            variant="outline"
          >
            Volver a proyectos
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <div className="p-6 bg-orange-50 text-orange-600 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Proyecto no encontrado</h2>
          <p>
            El proyecto que buscas no existe o no tienes permiso para editarlo.
          </p>
          <Button
            onClick={() => router.push("/dashboard/projects")}
            className="mt-4"
            variant="outline"
          >
            Volver a proyectos
          </Button>
        </div>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Editar Proyecto</CardTitle>
          <CardDescription>Modifica los detalles del proyecto</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del proyecto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe brevemente el proyecto..."
                        className="min-h-32"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canAssignToDesigner && (
                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignar a diseñador</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar diseñador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sin asignar">
                            Sin asignar
                          </SelectItem>
                          {designers.map((designer) => (
                            <SelectItem key={designer.id} value={designer.id}>
                              {designer.name || designer.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Archivos actuales */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Archivos actuales</h3>

                {selectedFiles.length > 0 ? (
                  <div className="border rounded-md divide-y">
                    {selectedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium">{file.filename}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setFileToDelete(file.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No hay archivos adjuntos
                  </p>
                )}
              </div>

              {/* Añadir nuevos archivos */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Añadir nuevos archivos</h3>

                <Input type="file" multiple onChange={handleFileChange} />

                {newFiles && newFiles.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium mb-2">
                      Archivos seleccionados:
                    </p>
                    <ul className="text-sm space-y-1">
                      {Array.from(newFiles).map((file, index) => (
                        <li key={index} className="flex items-center">
                          <span className="truncate">{file.name}</span>
                          <span className="ml-2 text-gray-500">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-4 flex space-x-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/projects/${projectId}`)
                  }
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar archivos */}
      <AlertDialog
        open={!!fileToDelete}
        onOpenChange={() => setFileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El archivo será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && handleDeleteFile(fileToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
