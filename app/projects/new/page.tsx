"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { useProjectSubmission } from "@/app/projects/_hooks/useProjectSubmission";
import { ProjectForm } from "@/app/components/form/ProjectForm";

export default function NewProjectPage() {
  const router = useRouter();

  const { handleSubmit, isSubmitting, error } = useProjectSubmission();

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
