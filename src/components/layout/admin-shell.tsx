import { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
