"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { File as PrismaFile } from "@/generated/prisma";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Clock, FileDown, FileText, User } from "lucide-react";
import { ProjectWithRelations } from "@/app/projects/_utils/types";
import { formatFileSize } from "@/app/projects/_utils/formatFileSize";
import { formatDate } from "@/app/projects/_utils/dateUtils";
import { useProjectDetails } from "@/app/projects/_hooks/useProjectDetails";
import {
  ErrorMessage,
  ProjectDetails,
  ProjectDetailSkeleton,
} from "@/app/components/projects";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: Props) {
  // Desenvolver params con React.use() según nueva API de Next.js
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;
  const router = useRouter();

  const {
    project,
    loading,
    error,
    canManageProject,
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
        message="El proyecto que buscas no existe o no tienes permiso para verlo."
        onBack={() => router.push(ROUTES.PROJECTS)}
      />
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <ProjectHeader
        project={project}
        canManage={canManageProject(project)}
        onEdit={() => router.push(ROUTES.EDIT_PROJECT(projectId))}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              {project.description ? (
                <p className="whitespace-pre-line">{project.description}</p>
              ) : (
                <p className="text-gray-500 italic">Sin descripción</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Archivos</CardTitle>
            </CardHeader>

            <CardContent>
              {project.files.length > 0 ? (
                <FilesList
                  files={project.files}
                  onDownload={downloadFile}
                  isDownloading={isDownloading}
                />
              ) : (
                <p className="text-gray-500 italic">No hay archivos adjuntos</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral */}
        <div>
          <ProjectDetails project={project} />

          <div className="mt-10">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(ROUTES.PROJECTS)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver a proyectos
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
  onEdit,
}: {
  project: ProjectWithRelations;
  canManage: boolean;
  onEdit: () => void;
}) => (
  <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
    <div>
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <div className="flex items-center space-x-4 mt-2">
        <p className="text-sm text-gray-500">
          <Clock className="inline mr-1 h-4 w-4" />
          Creado: {formatDate(project.createdAt.toString())}
        </p>

        {project.assignedTo ? (
          <Badge variant="outline" className="bg-green-50">
            <User className="mr-1 h-3 w-3" />
            Asignado a: {project.assignedTo.name || project.assignedTo.email}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50">
            Sin asignar
          </Badge>
        )}
      </div>
    </div>

    {canManage && <Button onClick={onEdit}>Editar Proyecto</Button>}
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
          <FileText className="mr-2 h-4 w-4 text-gray-500" />
          <div>
            <p className="font-medium">{file.filename}</p>
            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onDownload(file)}
          disabled={isDownloading}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Descargar
        </Button>
      </li>
    ))}
  </ul>
);
