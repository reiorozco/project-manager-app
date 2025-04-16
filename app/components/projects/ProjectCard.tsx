import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Project } from "@/app/projects/_utils/types";

interface ProjectCardProps {
  project: Project;
  canManage: boolean;
  onDelete: (projectId: string) => void;
  onViewDetails: () => void;
  onEdit: () => void;
}

function ProjectCard({
  project,
  canManage,
  onDelete,
  onViewDetails,
  onEdit,
}: ProjectCardProps) {
  return (
    <Card className="flex justify-between">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{project.title}</CardTitle>

          {canManage && (
            <ProjectCardMenu
              onEdit={onEdit}
              onDelete={() => onDelete(project.id)}
            />
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            {project.description || "Sin descripción"}
          </p>
        </div>

        <ProjectCardDetails project={project} />
      </CardContent>

      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onViewDetails}>
          Ver detalles
        </Button>
      </CardFooter>
    </Card>
  );
}

function ProjectCardDetails({ project }: { project: Project }) {
  return (
    <div className="text-xs text-gray-500 space-y-1">
      <div>
        <span className="font-medium">Creado por:</span>{" "}
        {project.createdBy.name || project.createdBy.email}
      </div>

      <div>
        <span className="font-medium">Asignado a:</span>{" "}
        {project.assignedTo
          ? project.assignedTo.name || project.assignedTo.email
          : "Sin asignar"}
      </div>

      <div>
        <span className="font-medium">Archivos:</span> {project.files.length}
      </div>
    </div>
  );
}

function ProjectCardMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>

        <DropdownMenuItem className="text-red-600" onClick={onDelete}>
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProjectCard;
