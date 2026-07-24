import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import { getProjectsForUser } from "@/lib/services/project-service";
import {
  DashboardHeader,
  ProjectStats,
  RecentProjects,
} from "@/app/components/dashboard";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return redirect("/auth/login");
  }

  const role = session.user.role as UserRole;
  const projects = await getProjectsForUser(session.user.id);

  return (
    <div className="container mx-auto max-w-5xl py-4 px-4 sm:px-6 lg:px-8">
      <DashboardHeader userRole={role} />
      <ProjectStats projects={projects} />
      <RecentProjects projects={projects} />
    </div>
  );
}
