import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DashboardHeader,
  ProjectStats,
  QuickActions,
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

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <DashboardHeader userRole={role} />

      <ProjectStats userId={user.id} />

      <QuickActions userRole={role} />
    </div>
  );
}
