"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { File as PrismaFile, ProjectStatus } from "@/generated/prisma";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarClock,
  ChevronLeft,
  Clock,
  FileDown,
  FileText,
  User,
} from "lucide-react";
import { ProjectWithRelations } from "@/app/projects/_utils/types";
import { formatFileSize } from "@/app/projects/_utils/formatFileSize";
import { formatDate, formatDueDate } from "@/app/projects/_utils/dateUtils";
import { useProjectDetails } from "@/app/projects/_hooks/useProjectDetails";
import {
  ErrorMessage,
  ProjectDetails,
  ProjectDetailSkeleton,
  StatusControl,
} from "@/app/components/projects";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: Props) {
  // Unwrap params with React.use() per the new Next.js API
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;
  const router = useRouter();

  const {
    project,
    loading,
    error,
    canManageProject,
    allowedStatusTargets,
    updateStatus,
    isUpdatingStatus,
    downloadFile,
    isDownloading,
  } = useProjectDetails(projectId);

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onBack={() => router.push(ROUTES.PROJECTS)}
      />
    );
  }

  if (!project) {
    return (
      <ErrorMessage
        message="This project doesn't exist or you don't have permission to view it."
        onBack={() => router.push(ROUTES.PROJECTS)}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-4 px-4 sm:px-6 lg:px-8">
      <ProjectHeader
        project={project}
        canManage={canManageProject(project)}
        statusTargets={allowedStatusTargets(project)}
        onChangeStatus={updateStatus}
        isUpdatingStatus={isUpdatingStatus}
        onEdit={() => router.push(ROUTES.EDIT_PROJECT(projectId))}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {project.description ? (
                <p className="whitespace-pre-line">{project.description}</p>
              ) : (
                <p className="text-muted-foreground italic">No description</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Files</CardTitle>
            </CardHeader>

            <CardContent>
              {project.files.length > 0 ? (
                <FilesList
                  files={project.files}
                  onDownload={downloadFile}
                  isDownloading={isDownloading}
                />
              ) : (
                <p className="text-muted-foreground italic">No files attached</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div>
          <ProjectDetails project={project} />

          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(ROUTES.PROJECTS)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to projects
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ProjectHeader = ({
  project,
  canManage,
  statusTargets,
  onChangeStatus,
  isUpdatingStatus,
  onEdit,
}: {
  project: ProjectWithRelations;
  canManage: boolean;
  statusTargets: ProjectStatus[];
  onChangeStatus: (status: ProjectStatus) => void;
  isUpdatingStatus: boolean;
  onEdit: () => void;
}) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <StatusControl
          status={project.status}
          targets={statusTargets}
          onChange={onChangeStatus}
          isUpdating={isUpdatingStatus}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          Created {formatDate(project.createdAt.toString())}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <User className="h-4 w-4" />
          {project.assignedTo
            ? project.assignedTo.name || project.assignedTo.email
            : "Unassigned"}
        </span>

        {project.dueDate && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4" />
            Due {formatDueDate(project.dueDate)}
          </span>
        )}
      </div>
    </div>

    {canManage && <Button onClick={onEdit}>Edit project</Button>}
  </div>
);

const FilesList = ({
  files,
  onDownload,
  isDownloading,
}: {
  files: PrismaFile[];
  onDownload: (file: PrismaFile) => Promise<void>;
  isDownloading?: boolean;
}) => (
  <ul className="divide-y">
    {files.map((file) => (
      <li key={file.id} className="py-3 flex justify-between items-center">
        <div className="flex items-center">
          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{file.filename}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onDownload(file)}
          disabled={isDownloading}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Download
        </Button>
      </li>
    ))}
  </ul>
);
