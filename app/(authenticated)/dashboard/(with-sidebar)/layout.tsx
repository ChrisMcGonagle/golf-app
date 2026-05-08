import DashboardSidebar from "@/components/DashboardSidebar";
import { getPendingMembershipRequestCountForAdmin } from "@/lib/actions/getMembershipRequests";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingRequestsCount = await getPendingMembershipRequestCountForAdmin();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <DashboardSidebar pendingRequestsCount={pendingRequestsCount} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-8">{children}</main>
    </div>
  );
}
