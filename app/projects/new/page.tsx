"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/app/auth/auth-context";
import { useProjectSubmission } from "@/app/projects/_hooks/useProjectSubmission";
import { ProjectForm } from "@/app/components/form/ProjectForm";

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { handleSubmit, isSubmitting, error } = useProjectSubmission({
    onSuccess: () => {
      router.push(ROUTES.PROJECTS);
      router.refresh();
    },
  });

  useEffect(() => {
    if (!user) {
      router.push(ROUTES.LOGIN);
      console.log("Usuario no autenticado");
    }
  }, [user, router]);

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <ProjectForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        onCancel={() => router.push(ROUTES.PROJECTS)}
      />
    </div>
  );
}
