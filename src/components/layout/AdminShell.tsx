import Link from "next/link";
import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "ダッシュボード" },
  { href: "/admin/reservations", label: "予約一覧" },
  { href: "/admin/messages", label: "送信ログ" },
  { href: "/admin/settings/slots", label: "枠設定" },
];

type AdminShellProps = PropsWithChildren<{
  title?: string;
}>;

export function AdminShell({ title, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r bg-background">
          <div className="px-6 py-6">
            <div className="text-lg font-semibold">Clinic SaaS</div>
            <p className="text-sm text-muted-foreground">管理コンソール</p>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">
          <header className={cn("border-b bg-background px-8 py-6", !title && "py-4")}>
            {title && <h1 className="text-xl font-semibold">{title}</h1>}
          </header>
          <section className="px-8 py-6">{children}</section>
        </main>
      </div>
    </div>
  );
}
