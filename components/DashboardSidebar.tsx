"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardSidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard/submissions", label: "Submissions" },
    { href: "/dashboard/members", label: "Members" },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen">
      <nav className="flex flex-col p-6">
        <h2 className="text-lg font-bold mb-8">Admin</h2>
        <ul className="space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block px-4 py-2 rounded transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
