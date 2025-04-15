import Link from "next/link";
import { User } from "@supabase/supabase-js";

interface NavItem {
  name: string;
  href: string;
  active: boolean;
}

interface MobileNavigationProps {
  navItems: NavItem[];
  user: User | null;
  onClose: () => void;
  onSignOut: () => Promise<void>;
}

/**
 * Componente para la navegación en dispositivos móviles
 */
export default function MobileNavigation({
  navItems,
  user,
  onClose,
  onSignOut,
}: MobileNavigationProps) {
  return (
    <div className="sm:hidden">
      <div className="space-y-1 pb-3 pt-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`block py-2 pl-3 pr-4 text-base font-medium ${
              item.active
                ? "bg-blue-50 border-l-4 border-blue-500 text-blue-700"
                : "border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            }`}
            onClick={onClose}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <MobileUserProfile user={user} onSignOut={onSignOut} />
    </div>
  );
}

function MobileUserProfile({
  user,
  onSignOut,
}: {
  user: User | null;
  onSignOut: () => Promise<void>;
}) {
  return (
    <div className="border-t border-gray-200 pb-3 pt-4">
      <div className="flex items-center px-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="ml-3">
          <div className="text-base font-medium text-gray-800">
            {user?.email?.split("@")[0]}
          </div>
          <div className="text-sm font-medium text-gray-500">{user?.email}</div>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <button
          onClick={onSignOut}
          className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 w-full text-left"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
