"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import BaffyBrand from "@/components/BaffyBrand";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [membershipOpen, setMembershipOpen] = useState(false);

  // Auto-expand membership menu if on a submenu route
  useEffect(() => {
    if (pathname === "/dashboard/members" || pathname === "/dashboard/submissions") {
      setMembershipOpen(true);
    }
  }, [pathname]);

  const isNavActive = (href: string) => pathname === href;
  const isSubmenuActive = isNavActive("/dashboard/members") || isNavActive("/dashboard/submissions");

  const handleMembershipClick = () => {
    // Only toggle if NOT on a submenu route
    if (!isSubmenuActive) {
      setMembershipOpen(!membershipOpen);
    }
  };

  const handleNavClick = () => {
    setMembershipOpen(false);
  };

  return (
    <aside className="w-64 bg-white text-[#2b2b2b] min-h-screen border-r border-[#e5e7eb]">
      {/* Baffy branding — no border below */}
      <div className="p-4">
        <BaffyBrand />
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-2">
        {/* Dashboard link */}
        <Link
          href="/dashboard"
          onClick={handleNavClick}
          className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
            isNavActive("/dashboard")
              ? "bg-gray-100 text-[#2b2b2b] font-semibold"
              : "text-[#2b2b2b] hover:bg-gray-50"
          }`}
        >
          <span className="mr-3 text-lg">📊</span>
          Dashboard
        </Link>

        {/* Accounts link */}
        <Link
          href="/dashboard/accounts"
          onClick={handleNavClick}
          className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
            isNavActive("/dashboard/accounts")
              ? "bg-gray-100 text-[#2b2b2b] font-semibold"
              : "text-[#2b2b2b] hover:bg-gray-50"
          }`}
        >
          <span className="mr-3 text-lg">👤</span>
          Accounts
        </Link>

        {/* Membership with collapsible submenu */}
        <div>
          <button
            onClick={handleMembershipClick}
            className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-[#2b2b2b] transition-colors duration-200 focus:outline-none"
          >
            <div className="flex items-center">
              <span className="mr-3 text-lg">🏌️</span>
              Membership
            </div>
            <svg
              aria-hidden="true"
              viewBox="0 0 12 8"
              width="12"
              height="8"
              className={`transition-transform duration-200 ${
                membershipOpen ? '' : 'rotate-180'
              }`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1 1.5L6 6.5L11 1.5" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Submenu with tree lines */}
          {membershipOpen && (
            <div className="mt-0 ml-8 space-y-0 relative">
              {/* Vertical line container */}
              <div className="absolute w-0 border-l-2 border-[#e5e7eb]" style={{ left: '-6px', top: '0', bottom: '0', height: 'calc(100% - 8px)' }}></div>
              
              {/* Pending item with horizontal branch */}
              <div className="relative pl-5">
                <span className="absolute left-0 top-1/2 w-3 h-px -translate-y-1/2 bg-[#e5e7eb]"></span>
                <Link
                  href="/dashboard/submissions"
                  className={`flex items-center px-4 py-1.5 rounded text-sm transition-colors duration-200 ${
                    isNavActive("/dashboard/submissions")
                      ? "bg-gray-100 text-[#2b2b2b] font-semibold"
                      : "text-[#2b2b2b] hover:bg-gray-50"
                  }`}
                >
                  Pending
                </Link>
              </div>

              {/* Member List item with horizontal branch */}
              <div className="relative pl-5">
                <span className="absolute left-0 top-1/2 w-3 h-px -translate-y-1/2 bg-[#e5e7eb]"></span>
                <Link
                  href="/dashboard/members"
                  className={`flex items-center px-4 py-1.5 rounded text-sm transition-colors duration-200 ${
                    isNavActive("/dashboard/members")
                      ? "bg-gray-100 text-[#2b2b2b] font-semibold"
                      : "text-[#2b2b2b] hover:bg-gray-50"
                  }`}
                >
                  Member List
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
