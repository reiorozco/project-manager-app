import { useState } from "react";
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
import { ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import { ProjectWithRelations } from "@/app/projects/_utils/types";

interface ProjectCardProps {
  project: ProjectWithRelations;
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
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
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

      <CardContent className="flex-grow">
        <TruncatedDescription
          description={project.description || "Sin descripción"}
        />

        <div className="mt-4">
          <ProjectCardDetails project={project} />
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Button variant="outline" className="w-full" onClick={onViewDetails}>
          Ver detalles
        </Button>
      </CardFooter>
    </Card>
  );
}

function TruncatedDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLongText = description.length > 120;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="mb-2">
      <div
        className={`text-sm text-gray-600 overflow-hidden transition-all duration-200 ${
          !expanded && isLongText ? `line-clamp-3` : ""
        }`}
      >
        {description}
      </div>

      {isLongText && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-6 px-2 text-xs text-muted-foreground hover:text-primary"
          onClick={toggleExpanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Mostrar más
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function ProjectCardDetails({ project }: { project: ProjectWithRelations }) {
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
