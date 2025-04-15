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
    <Button onClick={onClick} className="h-auto py-6" variant={variant}>
      <div className="flex flex-col items-center">
        {icon}

        <span>{label}</span>
      </div>
    </Button>
  );
}

export default ActionButton;
