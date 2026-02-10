import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatVisitPurpose } from "@/lib/format";
import { prisma } from "@/lib/prisma";

import { CancelButton } from "./cancel-button";

export const dynamic = "force-dynamic";

export default async function AdminReservationDetailPage({
  params
}: {
  params: { id: string };
}) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: { intakeAnswer: true, messageLogs: true }
  });

  if (!reservation) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">予約詳細</h1>
          <p className="text-sm text-muted-foreground">
            {reservation.patientName} / {formatDateTime(reservation.slotStart)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={reservation.status === "cancelled" ? "destructive" : "outline"}>
            {reservation.status === "cancelled" ? "キャンセル" : "予約済み"}
          </Badge>
          <CancelButton reservationId={reservation.id} disabled={reservation.status === "cancelled"} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>患者情報</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">氏名</p>
            <p className="font-medium">{reservation.patientName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">電話番号</p>
            <p className="font-medium">{reservation.patientPhone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">来院目的</p>
            <p className="font-medium">{formatVisitPurpose(reservation.purpose)}</p>
          </div>
          {reservation.cardNumber ? (
            <div>
              <p className="text-sm text-muted-foreground">診察券番号</p>
              <p className="font-medium">{reservation.cardNumber}</p>
            </div>
          ) : null}
          <div>
            <p className="text-sm text-muted-foreground">予約時刻</p>
            <p className="font-medium">{formatDateTime(reservation.slotStart)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>問診内容</CardTitle>
        </CardHeader>
        <CardContent>
          {reservation.intakeAnswer ? (
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
              {(() => {
                try {
                  return JSON.stringify(
                    JSON.parse(reservation.intakeAnswer.answers),
                    null,
                    2
                  );
                } catch {
                  return reservation.intakeAnswer.answers;
                }
              })()}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">問診は未回答です。</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>送信ログ</CardTitle>
        </CardHeader>
        <CardContent>
          {reservation.messageLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">送信ログはありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>種別</TableHead>
                  <TableHead>チャネル</TableHead>
                  <TableHead>送信時刻</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservation.messageLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.type}</TableCell>
                    <TableCell>{log.channel}</TableCell>
                    <TableCell>{formatDateTime(log.sentAt)}</TableCell>
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
