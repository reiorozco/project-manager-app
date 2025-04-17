import { Clock, FileText, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectWithRelations } from "@/app/projects/_utils/types";
import { formatDate } from "@/app/projects/_utils/dateUtils";

export const ProjectDetails = ({
  project,
}: {
  project: ProjectWithRelations;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Detalles</CardTitle>
    </CardHeader>

    <CardContent>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">
            <User className="inline mr-1 h-4 w-4" />
            Creado por
          </h3>
          <p>{project.createdBy.name || project.createdBy.email}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">
            <Clock className="inline mr-1 h-4 w-4" />
            Fecha de creación
          </h3>
          <p>{formatDate(project.createdAt.toString())}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">
            <Clock className="inline mr-1 h-4 w-4" />
            Última actualización
          </h3>
          <p>
            {formatDate(
              project.updatedAt?.toString() || project.createdAt.toString(),
            )}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Estado</h3>
          <p>
            {project.assignedTo
              ? `Asignado a ${project.assignedTo.name || project.assignedTo.email}`
              : "Sin asignar"}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">
            <FileText className="inline mr-1 h-4 w-4" />
            Archivos
          </h3>
          <p>{project.files.length} archivos</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ProjectDetails;
