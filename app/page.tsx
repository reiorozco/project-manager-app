import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectsForUser } from "@/lib/services/project-service";
import {
  DashboardHeader,
  ProjectStats,
  RecentProjects,
} from "@/app/components/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }
  const {
    user_metadata: { role },
  } = user;

  const projects = await getProjectsForUser(user.id);

  return (
    <div className="container mx-auto max-w-5xl py-4 px-4 sm:px-6 lg:px-8">
      <DashboardHeader userRole={role} />

      <ProjectStats projects={projects} />

      <RecentProjects projects={projects} />
    </div>
  );
}
