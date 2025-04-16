import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProjectFormValues, projectSchema } from "@/app/projects/_utils/types";
import { FileUploader } from "@/app/components/form/FileUploader";

interface ProjectFormProps {
  onSubmit: (values: ProjectFormValues, files: File[]) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
}

export function ProjectForm({
  onSubmit,
  isSubmitting,
  error,
  onCancel,
}: ProjectFormProps) {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  // Configuración del formulario con validación
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      files: [],
    },
  });

  const handleFormSubmit = (values: ProjectFormValues) => {
    void onSubmit(values, selectedFiles);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo Proyecto</CardTitle>
        <CardDescription>Crea un nuevo proyecto de diseño</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Alerta de error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Formulario */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
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

            {/* Selector de archivos */}
            <FormField
              control={form.control}
              name="files"
              render={({ field: { value, onChange, ...field } }) => (
                <FileUploader
                  {...field}
                  selectedFiles={selectedFiles}
                  onFilesChange={(files) => {
                    setSelectedFiles(files);
                    form.setValue("files", files);
                  }}
                />
              )}
            />

            {/* Botones de acción */}
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creando proyecto..." : "Crear Proyecto"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-center border-t pt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </CardFooter>
    </Card>
  );
}
