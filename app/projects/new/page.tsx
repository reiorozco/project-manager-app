"use client";

import React, { useState } from "react";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/app/auth/auth-context";
import { createClient } from "@/utils/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const projectSchema = z.object({
  title: z
    .string()
    .min(3, { message: "El título debe tener al menos 3 caracteres" }),
  description: z.string().optional(),
  files: z.array(z.instanceof(File)).optional(),
});

export default function NewProjectPage() {
  const { user } = useAuth();

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const supabase = createClient();

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      files: [],
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log("files", files);

    // Validar tamaño de archivos
    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError(
        `Algunos archivos exceden el tamaño máximo de 5 MB: ${oversizedFiles.map((f) => f.name).join(", ")}`,
      );
      return;
    }

    setSelectedFiles(files);
    form.setValue("files", files);
  };

  const onSubmit = async (values: z.infer<typeof projectSchema>) => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Subir archivos a Supabase Storage si existen
      const uploadedFiles = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
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
      }

      // 2. Crear el proyecto con los archivos subidos
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description || "",
          files: uploadedFiles,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear el proyecto");
      }

      // Redireccionar a la lista de proyectos
      router.push("/dashboard/projects");
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="files"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Archivos</FormLabel>
                    <FormControl>
                      <div className="flex flex-col space-y-2">
                        <Input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          {...field}
                        />
                        {selectedFiles.length > 0 && (
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm font-medium mb-2">
                              Archivos seleccionados:
                            </p>
                            <ul className="text-sm space-y-1">
                              {selectedFiles.map((file, index) => (
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            onClick={() => router.push("/dashboard/projects")}
          >
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
