"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import HickoryBrand from "@/components/HickoryBrand";

type DashboardSidebarProps = {
  pendingRequestsCount?: number;
};

function DashboardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mr-3 h-5 w-5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="7" height="7" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="3" width="7" height="7" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="14" width="7" height="7" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="14" width="7" height="7" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mr-3 h-5 w-5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 21C19 17.6863 15.866 15 12 15C8.13401 15 5 17.6863 5 21" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="8" r="4" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MembershipIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mr-3 h-5 w-5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="12" r="2" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 10H17" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 14H17" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardSidebar({ pendingRequestsCount = 0 }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [membershipOpen, setMembershipOpen] = useState(false);

  // Auto-expand membership menu if on a submenu route
  useEffect(() => {
    if (pathname === "/dashboard/members" || pathname === "/dashboard/requests") {
      setMembershipOpen(true);
    }
  }, [pathname]);

  const isNavActive = (href: string) => pathname === href;
  const isSubmenuActive = isNavActive("/dashboard/members") || isNavActive("/dashboard/requests");
  const isDashboardActive = isNavActive("/dashboard");
  const isAccountsActive = isNavActive("/dashboard/accounts");
  const isRequestsActive = isNavActive("/dashboard/requests");
  const isMemberListActive = isNavActive("/dashboard/members");

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
      {/* HICKORY wordmark */}
      <div className="p-4">
        <HickoryBrand />
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-2">
        {/* Dashboard link */}
        <Link
          href="/dashboard"
          onClick={handleNavClick}
          className={`relative flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
            isDashboardActive
              ? "bg-gray-100 text-[#2b2b2b] font-semibold"
              : "text-[#2b2b2b] hover:bg-gray-50"
          }`}
        >
          {isDashboardActive && <span aria-hidden="true" className="absolute left-0 top-1/2 h-[50%] w-[2px] -translate-y-1/2 rounded-full bg-[#000000]" />}
          <DashboardIcon />
          Dashboard
        </Link>

        {/* Accounts link */}
        <Link
          href="/dashboard/accounts"
          onClick={handleNavClick}
          className={`relative flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
            isAccountsActive
              ? "bg-gray-100 text-[#2b2b2b] font-semibold"
              : "text-[#2b2b2b] hover:bg-gray-50"
          }`}
        >
          {isAccountsActive && <span aria-hidden="true" className="absolute left-0 top-1/2 h-[50%] w-[2px] -translate-y-1/2 rounded-full bg-[#000000]" />}
          <AccountsIcon />
          Accounts
        </Link>

        {/* Membership with collapsible submenu */}
        <div>
          <button
            onClick={handleMembershipClick}
            className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-[#2b2b2b] transition-colors duration-200 focus:outline-none"
          >
            <div className="flex items-center">
              <MembershipIcon />
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
              
              {/* Requests item with horizontal branch */}
              <div className="relative pl-5">
                <span className="absolute left-0 top-1/2 w-3 h-px -translate-y-1/2 bg-[#e5e7eb]"></span>
                <Link
                  href="/dashboard/requests"
                  className={`relative flex items-center gap-3 px-4 py-1.5 rounded text-sm transition-colors duration-200 ${
                    isRequestsActive
                      ? "bg-gray-100 text-[#2b2b2b] font-semibold"
                      : "text-[#2b2b2b] hover:bg-gray-50"
                  }`}
                >
                  {isRequestsActive && <span aria-hidden="true" className="absolute left-0 top-1/2 h-[50%] w-[2px] -translate-y-1/2 rounded-full bg-[#000000]" />}
                  Requests
                  {pendingRequestsCount > 0 ? (
                    <span
                      aria-label={`${pendingRequestsCount} pending requests`}
                      className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-amber-500 bg-amber-500 px-1.5 text-[11px] font-semibold leading-none text-white shadow-sm ring-1 ring-amber-200 transition-colors duration-200"
                    >
                      {pendingRequestsCount}
                    </span>
                  ) : null}
                </Link>
              </div>

              {/* Member List item with horizontal branch */}
              <div className="relative pl-5">
                <span className="absolute left-0 top-1/2 w-3 h-px -translate-y-1/2 bg-[#e5e7eb]"></span>
                <Link
                  href="/dashboard/members"
                  className={`relative flex items-center px-4 py-1.5 rounded text-sm transition-colors duration-200 ${
                    isMemberListActive
                      ? "bg-gray-100 text-[#2b2b2b] font-semibold"
                      : "text-[#2b2b2b] hover:bg-gray-50"
                  }`}
                >
                  {isMemberListActive && <span aria-hidden="true" className="absolute left-0 top-1/2 h-[50%] w-[2px] -translate-y-1/2 rounded-full bg-[#000000]" />}
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
