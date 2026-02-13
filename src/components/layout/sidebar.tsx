import Link from "next/link";

const navItems = [
  { href: "/admin/dashboard", label: "ダッシュボード" },
  { href: "/admin/overview", label: "予約・待ち" },
  { href: "/admin/checkin", label: "受付チェックイン" },
  { href: "/admin/room", label: "診察室" },
  { href: "/admin/doctors", label: "医師一覧" },
  { href: "/admin/timetable", label: "タイムテーブル" },
  { href: "/admin/messages", label: "送信ログ" },
  { href: "/admin/settings/slots", label: "枠設定" }
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r bg-background">
      <div className="px-6 py-6">
        <div className="text-lg font-semibold">Clinic SaaS</div>
        <p className="text-xs text-muted-foreground">Demo Admin</p>
      </div>
      <nav className="flex flex-col gap-1 px-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
