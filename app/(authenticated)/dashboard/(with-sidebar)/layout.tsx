import DashboardSidebar from "@/components/DashboardSidebar";
import BaffyBrand from "@/components/BaffyBrand";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex items-center px-6 py-4 bg-white border-b border-gray-200">
        <BaffyBrand />
      </header>
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
