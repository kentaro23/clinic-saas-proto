import { redirect } from "next/navigation";

import { isAdminSession } from "@/lib/auth";

import { ClinicSettingsForm } from "./settings-form";

export default async function ClinicSettingsPage() {
  if (!isAdminSession()) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">医院設定</h1>
        <p className="text-sm text-muted-foreground">
          予約方式とLINE設定を管理します。
        </p>
      </div>
      <ClinicSettingsForm />
    </div>
  );
}
