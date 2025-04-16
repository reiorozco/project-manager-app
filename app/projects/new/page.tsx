"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/app/auth/auth-context";

// Importaciones de componentes y servicios modularizados
import { projectSchema, ProjectFormValues } from "./types";
import { FileUploadService } from "./fileUploadService";
import { projectService } from "./projectService";
import { FileSelector } from "./FileSelector";
import { ROUTES } from "@/lib/constants";

export default function NewProjectPage() {
  // Hooks y estado
  const { user, supabase } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Formulario con validación
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      files: [],
    },
  });
  const fileUploadService = new FileUploadService(supabase);

  // Verifica que el usuario esté autenticado al cargar la página
  useEffect(() => {
    if (!user) {
      console.log("Usuario no autenticado");
    }
  }, [user]);

  const onSubmit = async (values: ProjectFormValues) => {
    // Verificar autenticación
    if (!user) {
      setError("No se pudo crear el proyecto: Usuario no autenticado");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Subir archivos (si existen)
      const uploadedFiles = await fileUploadService.uploadMultipleFiles(
        selectedFiles,
        user.id,
      );

      // 2. Crear el proyecto con los archivos subidos
      await projectService.createProject(
        values.title,
        values.description || "",
        uploadedFiles,
      );

      // 3. Redireccionar a la lista de proyectos
      router.push(ROUTES.PROJECTS);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear el proyecto",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Proyecto</CardTitle>
          <CardDescription>Crea un nuevo proyecto de diseño</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mostrar mensajes de error */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Formulario */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Campo de título */}
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

              {/* Campo de descripción */}
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo de archivos */}
              <FormField
                control={form.control}
                name="files"
                render={({ field: { value, onChange, ...field } }) => (
                  <FileSelector
                    field={field}
                    selectedFiles={selectedFiles}
                    setSelectedFiles={setSelectedFiles}
                    setError={setError}
                    onFilesChange={(files) => form.setValue("files", files)}
                  />
                )}
              />

              {/* Botón de envío */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creando proyecto..." : "Crear Proyecto"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <Button
            variant="outline"
            onClick={() => router.push(ROUTES.PROJECTS)}
          >
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
