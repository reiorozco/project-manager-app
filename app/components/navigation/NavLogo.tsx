import Link from "next/link";
import { Folders } from "lucide-react";

/**
 * Componente para el logo de la aplicación
 */
export default function NavLogo() {
  return (
    <div className="flex flex-shrink-0 items-center">
      <Link href="/" className="text-blue-600">
        <Folders size="2rem" />
      </Link>
    </div>
  );
}
