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
      <CardTitle className="text-base">Details</CardTitle>
    </CardHeader>

    <CardContent>
      <dl className="divide-y divide-border/60">
        <DetailRow icon={<Tag />} label="Status">
          <StatusBadge status={project.status} />
        </DetailRow>

        <DetailRow
          icon={project.dueDate ? <CalendarClock /> : <CalendarOff />}
          label="Due date"
        >
          {project.dueDate ? (
            formatDueDate(project.dueDate)
          ) : (
            <span className="font-normal text-muted-foreground">
              No date
            </span>
          )}
        </DetailRow>

        <DetailRow icon={<User />} label="Created by">
          {project.createdBy.name || project.createdBy.email}
        </DetailRow>

        <DetailRow icon={<Clock />} label="Created">
          {formatDate(project.createdAt.toString())}
        </DetailRow>

        <DetailRow icon={<CalendarClock />} label="Last updated">
          {formatDate(
            project.updatedAt?.toString() || project.createdAt.toString(),
          )}
        </DetailRow>

        <DetailRow icon={<FileText />} label="Files">
          {project.files.length}{" "}
          {project.files.length === 1 ? "file" : "files"}
        </DetailRow>
      </dl>
    </CardContent>
  </Card>
);

export default ProjectDetails;
