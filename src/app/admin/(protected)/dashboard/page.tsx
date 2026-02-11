import Link from "next/link";

import { KpiCard } from "@/components/layout/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { formatTime, formatVisitPurpose } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const dateStr = toJstDateString(new Date());
  const { start: todayStart, end: todayEnd } = getJstDayRange(dateStr);

  const [reservations, reminderCount] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        slotStart: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: { slotStart: "asc" },
      include: { intakeAnswer: true }
    }),
    prisma.messageLog.count({
      where: { type: "reminder" }
    })
  ]);

  const todayBooked = reservations.filter((r) => r.status === "booked").length;
  const todayCancelled = reservations.filter((r) => r.status === "cancelled").length;
  const intakeComplete = reservations.filter((r) => r.intakeAnswer).length;
  const intakeRate = reservations.length
    ? Math.round((intakeComplete / reservations.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground">
          {toDateOnlyString(today)} の予約状況
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="今日の予約数" value={todayBooked} />
        <KpiCard title="キャンセル数" value={todayCancelled} />
        <KpiCard title="問診完了率" value={`${intakeRate}%`} />
        <KpiCard title="リマインド送信数" value={reminderCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>当日の予約一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">本日の予約はありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>番号</TableHead>
                  <TableHead>時刻</TableHead>
                  <TableHead>患者</TableHead>
                  <TableHead>目的</TableHead>
                  <TableHead>問診</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>{reservation.queueNumber ?? "-"}</TableCell>
                    <TableCell>{formatTime(reservation.slotStart)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/reservations/${reservation.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {reservation.patientName}
                      </Link>
                    </TableCell>
                    <TableCell>{formatVisitPurpose(reservation.purpose)}</TableCell>
                    <TableCell>
                      <Badge variant={reservation.intakeAnswer ? "default" : "secondary"}>
                        {reservation.intakeAnswer ? "完了" : "未完了"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={reservation.status === "cancelled" ? "destructive" : "outline"}
                      >
                        {reservation.status === "cancelled" ? "キャンセル" : "予約済み"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
