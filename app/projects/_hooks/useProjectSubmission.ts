import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth/auth-context";
import { FileUploadService } from "@/lib/services/fileUploadService";
import { projectService } from "@/app/projects/_utils/projectService";
import {
  ProjectFormValues,
  ProjectWithRelations,
} from "@/app/projects/_utils/types";
import { ROUTES } from "@/lib/constants";
import { useRouter } from "next/navigation";

interface UseProjectSubmissionProps {
  onSuccess?: (project?: ProjectWithRelations) => void;
  onError?: (error: string) => void;
}

export function useProjectSubmission({
  onSuccess,
  onError,
}: UseProjectSubmissionProps = {}) {
  const { user, supabase } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const fileUploadService = new FileUploadService(supabase);

  // Mutation to create a project
  const createProjectMutation = useMutation({
    mutationFn: async ({
      values,
      files,
    }: {
      values: ProjectFormValues;
      files: File[];
    }) => {
      if (!user) {
        throw new Error("Couldn't create project: user not authenticated");
      }

      // 1. Upload files (if any)
      const uploadedFiles = await fileUploadService.uploadMultipleFiles(
        files,
        user.id,
      );

      // 2. Create the project with the uploaded files
      return await projectService.createProject({
        title: values.title,
        description: values.description || "",
        status: values.status,
        dueDate: values.dueDate || null,
        files: uploadedFiles,
      });
    },
    onSuccess: (data) => {
      // Refresh the project list (refetch when returning to /projects)
      void queryClient.invalidateQueries({ queryKey: ["projects"] });

      router.push(ROUTES.PROJECTS);

      onSuccess?.(data?.project);
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to create the project";
      onError?.(errorMessage);
    },
  });

  // Mutation to update a project
  const updateProjectMutation = useMutation({
    mutationFn: async ({
      values,
      files,
      projectId,
    }: {
      values: ProjectFormValues;
      files: File[];
      projectId: string;
    }) => {
      if (!user) {
        throw new Error("Couldn't update project: user not authenticated");
      }

      if (!projectId) {
        throw new Error("Couldn't update project: projectId is not defined");
      }

      // 1. Upload files (if any)
      const uploadedFiles = await fileUploadService.uploadMultipleFiles(
        files,
        user.id,
      );

      // 2. Update the project with the uploaded files
      return await projectService.updateProject(projectId, {
        title: values.title,
        description: values.description || "",
        status: values.status,
        dueDate: values.dueDate || null,
        assignedToId:
          values.assignedToId === "sin-asignar" ? null : values.assignedToId,
        files: uploadedFiles,
      });
    },
    onSuccess: (data) => {
      // Update the cache for this specific project and refresh the list
      queryClient.setQueryData<{ project: ProjectWithRelations }>(
        ["project", data?.project?.id],
        () => ({
          project: data?.project,
        }),
      );
      void queryClient.invalidateQueries({ queryKey: ["projects"] });

      router.push(ROUTES.PROJECT_DETAILS(data?.project?.id));

      onSuccess?.(data?.project);
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to update the project";
      onError?.(errorMessage);
    },
  });

  const handleSubmit = (values: ProjectFormValues, files: File[]) => {
    createProjectMutation.mutate({ values, files });
  };

  const handleUpdateSubmit = (
    values: ProjectFormValues,
    newFiles: File[],
    projectId?: string,
  ) => {
    if (!projectId) {
      const errorMessage = "Couldn't update project: projectId is not defined";
      onError?.(errorMessage);
      return;
    }

    updateProjectMutation.mutate({ values, files: newFiles, projectId });
  };

  return {
    handleSubmit,
    handleUpdateSubmit,
    isSubmitting:
      createProjectMutation.isPending || updateProjectMutation.isPending,
    error:
      createProjectMutation.error?.message ||
      updateProjectMutation.error?.message ||
      null,

    createProjectMutation,
    updateProjectMutation,
    resetMutations: () => {
      createProjectMutation.reset();
      updateProjectMutation.reset();
    },
  };
}
