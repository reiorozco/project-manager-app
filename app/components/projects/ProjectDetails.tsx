import { CalendarClock, CalendarOff, Clock, FileText, Tag, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectWithRelations } from "@/app/projects/_utils/types";
import { formatDate, formatDueDate } from "@/app/projects/_utils/dateUtils";
import StatusBadge from "@/app/components/projects/StatusBadge";

const DetailRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 py-3">
    <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</span>
    <div className="min-w-0 space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  </div>
);

export const ProjectDetails = ({
  project,
}: {
  project: ProjectWithRelations;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Detalles</CardTitle>
    </CardHeader>

    <CardContent>
      <dl className="divide-y divide-border/60">
        <DetailRow icon={<Tag />} label="Estado">
          <StatusBadge status={project.status} />
        </DetailRow>

        <DetailRow
          icon={project.dueDate ? <CalendarClock /> : <CalendarOff />}
          label="Fecha límite"
        >
          {project.dueDate ? (
            formatDueDate(project.dueDate)
          ) : (
            <span className="font-normal text-muted-foreground">
              Sin fecha
            </span>
          )}
        </DetailRow>

        <DetailRow icon={<User />} label="Creado por">
          {project.createdBy.name || project.createdBy.email}
        </DetailRow>

        <DetailRow icon={<Clock />} label="Creado">
          {formatDate(project.createdAt.toString())}
        </DetailRow>

        <DetailRow icon={<CalendarClock />} label="Última actualización">
          {formatDate(
            project.updatedAt?.toString() || project.createdAt.toString(),
          )}
        </DetailRow>

        <DetailRow icon={<FileText />} label="Archivos">
          {project.files.length}{" "}
          {project.files.length === 1 ? "archivo" : "archivos"}
        </DetailRow>
      </dl>
    </CardContent>
  </Card>
);

export default ProjectDetails;
