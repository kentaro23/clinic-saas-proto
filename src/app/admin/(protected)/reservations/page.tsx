import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { endOfDay, startOfDay, toDateOnlyString } from "@/lib/dates";
import { formatTime, formatVisitPurpose } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage({
  searchParams
}: {
  searchParams: { date?: string };
}) {
  const today = new Date();
  const dateStr = searchParams?.date ?? toDateOnlyString(today);
  const targetDate = new Date(`${dateStr}T00:00:00`);

  const reservations = await prisma.reservation.findMany({
    where: {
      slotStart: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate)
      }
    },
    orderBy: { slotStart: "asc" },
    include: { intakeAnswer: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">予約一覧</h1>
          <p className="text-sm text-muted-foreground">日付別の予約状況を確認できます。</p>
        </div>
        <form className="flex items-center gap-2" method="GET">
          <Input type="date" name="date" defaultValue={dateStr} />
        </form>
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
