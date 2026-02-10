import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { isAdminSession } from "@/lib/auth";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (!isAdminSession()) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
