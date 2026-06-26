import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function Loading() {
  return (
    <div className="container mx-auto max-w-5xl py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Stats */}
      <Skeleton className="mt-8 mb-4 h-4 w-24" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* Recientes */}
      <Skeleton className="mt-8 mb-4 h-4 w-40" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

export default Loading;
