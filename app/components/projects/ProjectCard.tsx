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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { File, MoreVertical, User } from "lucide-react";
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
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const creatorName = project.createdBy.name || project.createdBy.email;
  const assigneeName = project.assignedTo
    ? project.assignedTo.name || project.assignedTo.email
    : "Sin asignar";

  const creatorInitials = project.createdBy.name
    ? getInitials(project.createdBy.name)
    : project.createdBy.email.substring(0, 2).toUpperCase();

  const assigneeInitials = project.assignedTo?.name
    ? getInitials(project.assignedTo.name)
    : project.assignedTo
      ? project.assignedTo.email.substring(0, 2).toUpperCase()
      : "NA";

  return (
    <Card className="overflow-hidden border-muted hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">
            {project.title}
          </CardTitle>
          {canManage && (
            <ProjectCardMenu
              onEdit={onEdit}
              onDelete={() => onDelete(project.id)}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col justify-between flex-grow">
        <TruncatedDescription
          description={project.description || "Sin descripción"}
        />

        <div className="flex flex-col space-y-2">
          <Separator className="my-2" />

          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1 opacity-70" />
              <span className="font-medium mr-1">Creador:</span>
              <div className="flex items-center">
                <Avatar className="h-5 w-5 mr-1">
                  <AvatarFallback className="text-[10px]">
                    {creatorInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-32">{creatorName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1 opacity-70" />
              <span className="font-medium mr-1">Asignado:</span>
              <div className="flex items-center">
                <Avatar className="h-5 w-5 mr-1">
                  <AvatarFallback className="text-[10px]">
                    {assigneeInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-32">{assigneeName}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Badge
              variant="outline"
              className="flex items-center bg-blue-50 dark:bg-blue-950"
            >
              <File className="h-3 w-3 mr-1" />
              {project.files.length} archivos
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="secondary"
          size="sm"
          className="w-full text-xs font-medium"
          onClick={onViewDetails}
        >
          Ver detalles
        </Button>
      </CardFooter>
    </Card>
  );
}

function TruncatedDescription({ description }: { description: string }) {
  const isLongText = description.length > 120;

  return (
    <div>
      <div
        className={`text-sm text-muted-foreground overflow-hidden transition-all duration-200 ${
          isLongText ? `line-clamp-3` : ""
        }`}
      >
        {description}
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
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProjectCard;
