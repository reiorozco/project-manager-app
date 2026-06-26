import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  title: string;
  value: number;
  loading?: boolean;
  icon?: React.ReactNode;
  accent?: boolean;
}

function StatCard({ title, value, loading, icon, accent }: Props) {
  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardContent className="flex items-center gap-4 py-5">
        {icon && (
          <span
            className={
              accent
                ? "flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5"
                : "flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-5"
            }
          >
            {icon}
          </span>
        )}

        <div className="space-y-0.5">
          {loading ? (
            <Skeleton className="h-8 w-14" />
          ) : (
            <div className="text-3xl font-bold leading-none tabular-nums">
              {value}
            </div>
          )}
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
