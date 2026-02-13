import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { formatTime, formatVisitPurpose } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage({
  searchParams
}: {
  searchParams: { date?: string };
}) {
  const dateStr = searchParams?.date ?? toJstDateString(new Date());
  const { start, end } = getJstDayRange(dateStr);

  const reservations = await prisma.reservation.findMany({
    where: {
      slotStart: {
        gte: start,
        lte: end
      }
    },
    orderBy: { slotStart: "asc" },
      include: { intakeAnswer: true }
  });
  const waitStatusLabel = (status: string) => {
    switch (status) {
      case "waiting":
        return "待ち";
      case "called":
        return "呼出中";
      case "arrived":
        return "診察中";
      case "done":
        return "完了";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">予約一覧</h1>
          <p className="text-sm text-muted-foreground">日付別の予約状況を確認できます。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/reservations/new">手動予約を追加</Link>
          </Button>
          <form className="flex items-center gap-2" method="GET">
            <Input type="date" name="date" defaultValue={dateStr} className="h-9" />
            <Button type="submit" size="sm" variant="outline">
              表示
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dateStr} の予約</CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">予約がありません。</p>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>番号</TableHead>
                <TableHead>時刻</TableHead>
                <TableHead>患者</TableHead>
                <TableHead>目的</TableHead>
                <TableHead>問診</TableHead>
                <TableHead>来院</TableHead>
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
                      <Badge variant="outline">
                        {reservation.arrivalStatus === "arrived" ? "来院済み" : "未来院"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {waitStatusLabel(reservation.waitStatus)}
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
