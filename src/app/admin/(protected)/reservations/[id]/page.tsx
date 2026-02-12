import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { formatDateTime, formatVisitPurpose } from "@/lib/format";
import { prisma } from "@/lib/prisma";

import { CancelButton } from "./cancel-button";
import { ReschedulePanel } from "./reschedule-panel";

export const dynamic = "force-dynamic";

export default async function AdminReservationDetailPage({
  params
}: {
  params: { id: string };
}) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: { intakeAnswer: true, messageLogs: true, reservationLogs: true }
  });

  if (!reservation) {
    notFound();
  }

  const dateStr = toJstDateString(reservation.slotStart);
  const { start, end } = getJstDayRange(dateStr);
  const dayReservations = await prisma.reservation.findMany({
    where: {
      status: "booked",
      slotStart: {
        gte: start,
        lte: end
      }
    },
    select: { id: true, queueNumber: true, slotStart: true }
  });
  const sorted = [...dayReservations].sort((a, b) => {
    if (a.queueNumber != null && b.queueNumber != null) {
      return a.queueNumber - b.queueNumber;
    }
    return a.slotStart.getTime() - b.slotStart.getTime();
  });
  const queueTotal = sorted.length;
  const queuePosition =
    sorted.findIndex((entry) => entry.id === reservation.id) + 1;
  const queuePercent =
    queueTotal > 0 && queuePosition > 0
      ? Math.round((queuePosition / queueTotal) * 100)
      : 0;

  const intake = reservation.intakeAnswer
    ? (() => {
        try {
          const parsed = JSON.parse(reservation.intakeAnswer.answers);
          return parsed && typeof parsed === "object" ? parsed : null;
        } catch {
          return null;
        }
      })()
    : null;

  const formatLog = (log: { type: string; payload: string }) => {
    try {
      const payload = JSON.parse(log.payload);
      if (log.type === "reschedule" && payload?.from && payload?.to) {
        return `予約変更: ${formatDateTime(new Date(payload.from))} → ${formatDateTime(new Date(payload.to))}`;
      }
      if (log.type === "cancel") {
        return `キャンセル (${payload?.by === "patient" ? "患者" : "管理"})`;
      }
      if (log.type === "wait_status") {
        return `待ちステータス変更: ${payload?.from ?? "-"} → ${payload?.to ?? "-"}`;
      }
    } catch {
      // ignore parse errors
    }
    return log.type;
  };

  const waitStatusLabel = {
    waiting: "待ち",
    called: "呼出中",
    arrived: "来院済み",
    done: "完了"
  }[reservation.waitStatus] ?? reservation.waitStatus;

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
            <p className="text-sm text-muted-foreground">呼び出し番号</p>
            <p className="font-medium">{reservation.queueNumber ?? "-"}</p>
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
          <div>
            <p className="text-sm text-muted-foreground">待ちステータス</p>
            <p className="font-medium">{waitStatusLabel}</p>
          </div>
        </CardContent>
      </Card>

      <ReschedulePanel
        reservationId={reservation.id}
        currentSlotStart={reservation.slotStart}
        disabled={reservation.status === "cancelled"}
      />

      <Card>
        <CardHeader>
          <CardTitle>待ち状況</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {queueTotal > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                全{queueTotal}人中 {queuePosition}番目
              </p>
              <div className="h-2 w-full rounded bg-muted">
                <div
                  className="h-2 rounded bg-primary"
                  style={{ width: `${queuePercent}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">待ち状況を計算できませんでした。</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>問診内容</CardTitle>
        </CardHeader>
        <CardContent>
          {intake ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">症状</p>
                <p className="font-medium">{intake.symptoms ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">発症時期</p>
                <p className="font-medium">{intake.onset ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">既往歴</p>
                <p className="font-medium">{intake.history ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">内服薬</p>
                <p className="font-medium">{intake.medications ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">アレルギー</p>
                <p className="font-medium">{intake.allergies ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">来院目的</p>
                <p className="font-medium">
                  {intake.visitType === "followup" ? "再診" : "初診"}
                </p>
              </div>
              {intake.cardNumber ? (
                <div>
                  <p className="text-sm text-muted-foreground">診察券番号</p>
                  <p className="font-medium">{intake.cardNumber}</p>
                </div>
              ) : null}
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">自由記述</p>
                <p className="font-medium whitespace-pre-wrap">
                  {intake.notes ?? "-"}
                </p>
              </div>
            </div>
          ) : reservation.intakeAnswer ? (
            <p className="text-sm text-muted-foreground">
              問診データの形式を読み取れませんでした。
            </p>
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

      <Card>
        <CardHeader>
          <CardTitle>変更履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {reservation.reservationLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">履歴はありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>内容</TableHead>
                  <TableHead>日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservation.reservationLogs
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatLog(log)}</TableCell>
                      <TableCell>{formatDateTime(log.createdAt)}</TableCell>
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
