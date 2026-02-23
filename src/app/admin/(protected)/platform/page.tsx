import { redirect } from "next/navigation";

import { isSuperAdminAuthenticated } from "@/lib/auth";

import { PlatformClinicForm } from "./platform-form";

export default function PlatformPage() {
  if (!isSuperAdminAuthenticated()) {
    redirect("/admin/platform/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">医院管理（運営）</h1>
        <p className="text-sm text-muted-foreground">
          新規医院の追加と管理ユーザーの発行を行います。
        </p>
      </div>
      <PlatformClinicForm />
    </div>
  );
}
