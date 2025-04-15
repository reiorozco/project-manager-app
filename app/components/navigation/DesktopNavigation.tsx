import Link from "next/link";

interface NavItem {
  name: string;
  href: string;
  active: boolean;
}

export default function DesktopNavigation({
  navItems,
}: {
  navItems: NavItem[];
}) {
  return (
    <div className="hidden sm:ml-6 sm:flex sm:space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
            item.active
              ? "border-b-2 border-blue-500 text-gray-900"
              : "border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
          }`}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}
