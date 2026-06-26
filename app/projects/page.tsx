"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { ProjectStatus } from "@/generated/prisma";
import {
  PROJECT_STATUS_ORDER,
  ROUTES,
  STATUS_DISPLAY_MAP,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Componentes
import {
  DeleteProjectDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  ProjectsList,
} from "@/app/components/projects";

import { useProjects } from "@/app/projects/_hooks/useProjects";

type StatusFilter = ProjectStatus | "ALL";
type SortKey = "recent" | "title" | "status";

export default function ProjectsPage() {
  const router = useRouter();
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("recent");

  const {
    projects,
    isLoading,
    error,
    deleteProject,
    isDeleting,
    canCreateProject,
    canManageProject,
  } = useProjects();

  const visibleProjects = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = projects.filter((p) => {
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false);
      const matchesStatus =
        statusFilter === "ALL" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    const sorted = [...filtered];
    if (sort === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title, "es"));
    } else if (sort === "status") {
      sorted.sort(
        (a, b) =>
          PROJECT_STATUS_ORDER.indexOf(a.status) -
          PROJECT_STATUS_ORDER.indexOf(b.status),
      );
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return sorted;
  }, [projects, query, statusFilter, sort]);

  const handleDeleteConfirm = () => {
    if (!projectToDelete) return;

    deleteProject(projectToDelete, {
      onSuccess: () => {
        setProjectToDelete(null);
      },
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  const hasProjects = projects.length > 0;

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
          {hasProjects && (
            <p className="mt-1 text-sm text-muted-foreground">
              {projects.length}{" "}
              {projects.length === 1 ? "proyecto" : "proyectos"} en total
            </p>
          )}
        </div>

        {canCreateProject && (
          <Button onClick={() => router.push(ROUTES.NEW_PROJECT)}>
            Nuevo proyecto
          </Button>
        )}
      </div>

      {hasProjects && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título o descripción..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              {PROJECT_STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_DISPLAY_MAP[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="title">Título (A–Z)</SelectItem>
              <SelectItem value="status">Estado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!hasProjects ? (
        <EmptyState canCreateProject={canCreateProject} />
      ) : visibleProjects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <SearchX className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">Sin resultados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ningún proyecto coincide con tu búsqueda o filtro.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery("");
              setStatusFilter("ALL");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <ProjectsList
          projects={visibleProjects}
          canManageProject={canManageProject}
          onDelete={setProjectToDelete}
          router={router}
        />
      )}

      <DeleteProjectDialog
        isOpen={!!projectToDelete || isDeleting}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
