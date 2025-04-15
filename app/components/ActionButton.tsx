import React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
}

function ActionButton({ onClick, icon, label, variant = "default" }: Props) {
  return (
    <Button
      onClick={onClick}
      className="h-auto py-4 flex flex-col items-center justify-center"
      variant={variant}
    >
      {icon}

      <span>{label}</span>
    </Button>
  );
}

export default ActionButton;
