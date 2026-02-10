import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinic SaaS Demo",
  description: "クリニック向け：LINE事前問診＋予約＋リマインドSaaS デモ"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
