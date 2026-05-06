"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import BaffyBrand from "@/components/BaffyBrand";

export default function DashboardSidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/submissions", label: "Pending" },
    { href: "/dashboard/members", label: "Member List" },
    { href: "/dashboard/accounts", label: "Accounts" },
  ];

  return (
    <aside className="w-64 bg-[#f5f6f5] text-[#2b2b2b] min-h-screen">
      <div className="p-4 border-b border-[#eeeeee]">
        <BaffyBrand />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <h2 className="text-lg font-bold mb-4 text-[#2b2b2b]">Admin</h2>
        <ul className="space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? "bg-gray-100 text-[#2b2b2b] font-semibold border-l-4 border-[#22c55e]"
                      : "text-[#969696] hover:bg-gray-50"
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
