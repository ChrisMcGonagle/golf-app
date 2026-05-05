'use client';

import InactivityProvider from '@/components/InactivityProvider';

interface AuthenticatedShellProps {
  children: React.ReactNode;
}

export default function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  return (
    <InactivityProvider>
      {children}
    </InactivityProvider>
  );
}