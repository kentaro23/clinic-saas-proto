import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-grid">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center">
        <p className="text-sm font-semibold text-muted-foreground">
          デモ用プロトタイプ
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          クリニック向け：LINE事前問診＋予約＋リマインドSaaS
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          投資家向けデモとして、予約→問診→管理確認→リマインド送信までを
          一通り体験できます。
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild>
            <Link href="/p/booking">患者：予約を開始</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/admin/login">管理画面へ</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
