"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import { ProjectStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "@/app/components/projects/StatusBadge";

interface StatusControlProps {
  status: ProjectStatus;
  /** Statuses the current user is allowed to set. Empty → read-only badge. */
  targets: ProjectStatus[];
  onChange: (status: ProjectStatus) => void;
  isUpdating?: boolean;
}

export function StatusControl({
  status,
  targets,
  onChange,
  isUpdating,
}: StatusControlProps) {
  // No allowed transitions → render a plain, read-only badge.
  if (targets.length === 0) {
    return <StatusBadge status={status} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isUpdating}
          aria-label="Change status"
          className={cn(
            "inline-flex items-center gap-1 rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-60",
          )}
        >
          <StatusBadge status={status} />
          {isUpdating ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Set status
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {targets.map((target) => (
          <DropdownMenuItem
            key={target}
            className="cursor-pointer justify-between gap-2"
            onSelect={() => {
              if (target !== status) onChange(target);
            }}
          >
            <StatusBadge status={target} />
            {target === status && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default StatusControl;
