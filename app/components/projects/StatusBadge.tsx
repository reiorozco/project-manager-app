import { CircleCheck, CircleDashed, CircleDot, Eye } from "lucide-react";
import { ProjectStatus } from "@/generated/prisma";
import { STATUS_DISPLAY_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Clases literales por estado (necesario para que Tailwind las detecte en build).
const STATUS_STYLES: Record<ProjectStatus, string> = {
  DRAFT: "text-status-draft bg-status-draft/10 border-status-draft/25",
  IN_PROGRESS:
    "text-status-progress bg-status-progress/10 border-status-progress/25",
  REVIEW: "text-status-review bg-status-review/10 border-status-review/30",
  DONE: "text-status-done bg-status-done/10 border-status-done/30",
};

const STATUS_ICONS: Record<ProjectStatus, React.ElementType> = {
  DRAFT: CircleDashed,
  IN_PROGRESS: CircleDot,
  REVIEW: Eye,
  DONE: CircleCheck,
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const Icon = STATUS_ICONS[status];

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {STATUS_DISPLAY_MAP[status]}
    </span>
  );
}

export default StatusBadge;
