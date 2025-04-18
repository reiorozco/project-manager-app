import React, { useState } from "react";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { FileUploader } from "@/app/components/form/FileUploader";

import { File as PrismaFile, User } from "@/generated/prisma";
import { ProjectFormValues, projectSchema } from "@/app/projects/_utils/types";
import { formatFileSize } from "@/app/projects/_utils/formatFileSize";

interface ProjectFormProps {
  onSubmit: (
    values: ProjectFormValues,
    files: File[],
    projectId?: string,
  ) => void;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  initialValues?: ProjectFormValues;
  existingFiles?: PrismaFile[];
  isEditMode?: boolean;
  onDeleteFile?: (fileId: string) => void;
  designers?: User[];
  canAssignToDesigner?: boolean;
  projectId?: string;
}

export function ProjectForm({
  onSubmit,
  isSubmitting,
  error,
  onCancel,
  initialValues,
  existingFiles = [],
  isEditMode = false,
  onDeleteFile,
  designers = [],
  canAssignToDesigner = false,
  projectId,
}: ProjectFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Diálogo de confirmación de eliminación
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Configuración del formulario con validación
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialValues || {
      title: "",
      description: "",
      assignedToId: "",
      files: [],
    },
  });

  const handleFormSubmit = (values: ProjectFormValues) => {
    void onSubmit(values, selectedFiles, projectId);
  };

  const handleDeleteConfirm = async () => {
    if (fileToDelete && onDeleteFile) {
      onDeleteFile(fileToDelete);
      setFileToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Editar Proyecto" : "Nuevo Proyecto"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Modifica los detalles del proyecto"
              : "Crea un nuevo proyecto de diseño"}
          </CardDescription>
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
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo de asignación a diseñador (solo para project managers) */}
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
                          <SelectItem value="sin-asignar">
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

              {/* Mostrar archivos existentes en modo edición */}
              {isEditMode && existingFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Archivos actuales</h3>
                  <div className="border rounded-md divide-y">
                    {existingFiles.map((file) => (
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
                          type="button"
                          onClick={() => setFileToDelete(file.id)}
                          disabled={isSubmitting}
                        >
                          Eliminar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de archivos nuevos */}
              <FormField
                control={form.control}
                name="files"
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                render={({ field: { value, onChange, ...field } }) => (
                  <FileUploader
                    {...field}
                    selectedFiles={selectedFiles}
                    onFilesChange={(files) => {
                      setSelectedFiles(files);
                      form.setValue("files", files);
                    }}
                    labelText={isEditMode ? "Añadir más archivos" : "Archivos"}
                  />
                )}
              />

              {/* Botones de acción */}
              <div className="pt-4 flex space-x-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? isEditMode
                      ? "Guardando..."
                      : "Creando proyecto..."
                    : isEditMode
                      ? "Guardar cambios"
                      : "Crear Proyecto"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
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
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
