import DashboardSidebar from "@/components/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <DashboardSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-8">{children}</main>
    </div>
  );
}
