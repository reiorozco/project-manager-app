// Interfaces compartidas para el módulo de proyectos
export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assignedToId: string | null;
  createdBy: {
    name: string | null;
    email: string;
  };
  assignedTo: {
    name: string | null;
    email: string;
  } | null;
  files: {
    id: string;
    filename: string;
    path: string;
    size: number;
  }[];
}

// Tipo para los permisos de usuario sobre un proyecto
export type ProjectPermissions = {
  canManageProject: (project: Project) => boolean;
};
