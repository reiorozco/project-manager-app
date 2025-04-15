import React from "react";

interface Props {
  message?: string;
}

function LoadingText({ message = "Cargando..." }: Props) {
  return <div className="flex justify-center items-center h-64">{message}</div>;
}

export default LoadingText;
