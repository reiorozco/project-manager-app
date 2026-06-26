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

import { File as PrismaFile, ProjectStatus, User } from "@/generated/prisma";
import { ProjectFormValues, projectSchema } from "@/app/projects/_utils/types";
import { formatFileSize } from "@/app/projects/_utils/formatFileSize";
import { PROJECT_STATUS_ORDER, STATUS_DISPLAY_MAP } from "@/lib/constants";

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

  // Delete confirmation dialog
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Form setup with validation
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialValues || {
      title: "",
      description: "",
      status: ProjectStatus.DRAFT,
      dueDate: "",
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
            {isEditMode ? "Edit project" : "New project"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Edit the project details"
              : "Create a new design project"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Error alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-6"
            >
              {/* Title field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly describe the project..."
                        className="min-h-32"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status and due date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROJECT_STATUS_ORDER.map((status) => (
                            <SelectItem key={status} value={status}>
                              {STATUS_DISPLAY_MAP[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Designer assignment field (project managers only) */}
              {canAssignToDesigner && (
                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to designer</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a designer" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          <SelectItem value="sin-asignar">
                            Unassigned
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

              {/* Show existing files in edit mode */}
              {isEditMode && existingFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Current files</h3>
                  <div className="border rounded-md divide-y">
                    {existingFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium">{file.filename}</p>
                          <p className="text-xs text-muted-foreground">
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
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New file selector */}
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
                    labelText={isEditMode ? "Add more files" : "Files"}
                  />
                )}
              />

              {/* Action buttons */}
              <div className="pt-4 flex space-x-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? isEditMode
                      ? "Saving..."
                      : "Creating project..."
                    : isEditMode
                      ? "Save changes"
                      : "Create project"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Confirmation dialog for deleting files */}
      <AlertDialog
        open={!!fileToDelete}
        onOpenChange={() => setFileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
