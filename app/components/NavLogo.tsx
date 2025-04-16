import Link from "next/link";
import { Folders } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export default function NavLogo() {
  return (
    <div className="flex flex-shrink-0 items-center">
      <Link href={ROUTES.DASHBOARD} className="text-blue-600">
        <Folders size="2rem" />
      </Link>
    </div>
  );
}
