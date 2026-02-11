import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

import { SendCallButton } from "./send-call-button";
import { SendReminderButton } from "./send-reminder-button";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await prisma.messageLog.findMany({
    orderBy: { sentAt: "desc" },
    include: { reservation: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">送信ログ</h1>
          <p className="text-sm text-muted-foreground">リマインド/呼び出し通知の記録一覧です。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SendReminderButton />
          <SendCallButton />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>メッセージ履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">送信ログはありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>種別</TableHead>
                  <TableHead>患者</TableHead>
                  <TableHead>チャネル</TableHead>
                  <TableHead>送信時刻</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>{message.type}</TableCell>
                    <TableCell>{message.reservation?.patientName ?? "-"}</TableCell>
                    <TableCell>{message.channel}</TableCell>
                    <TableCell>{formatDateTime(message.sentAt)}</TableCell>
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
