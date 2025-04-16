import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function Loading() {
  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Skeleton para el header */}
      <Skeleton className="h-32 w-full mb-6" />
      <Skeleton className="h-8 w-48 mb-4" />

      {/* Skeleton para el título de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-8 w-48 mb-4" />

      {/* Skeleton para el título de acciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export default Loading;
