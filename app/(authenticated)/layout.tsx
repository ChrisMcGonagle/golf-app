import InactivityProvider from '@/components/InactivityProvider';
import SignOffButton from '@/components/SignOffButton';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InactivityProvider>
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-end px-4 py-3 bg-white border-b border-gray-200">
          <SignOffButton className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded hover:bg-gray-700 transition-colors" />
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </InactivityProvider>
  );
}
