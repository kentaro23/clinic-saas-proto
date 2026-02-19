"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CallRow = {
  roomId: string;
  roomName: string;
  doctorName: string | null;
  current: { id: string; queueNumber: number | null; patientName: string } | null;
  next: { id: string; queueNumber: number | null; patientName: string } | null;
};

export default function CallBoardPage() {
  const [rows, setRows] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBoard = async () => {
    setLoading(true);
    const response = await fetch("/api/public/callboard");
    const data = await response.json();
    setRows(data.callboard ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBoard();
    const timer = setInterval(fetchBoard, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-muted/40 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">呼び出し案内</h1>
          <p className="text-sm text-muted-foreground">
            現在の呼び出しと次の患者を表示します。
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">更新中...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">診察室がありません。</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <Card key={row.roomId} className="min-h-[180px]">
                <CardHeader>
                  <CardTitle className="text-base">
                    {row.roomName}
                    <span className="ml-2 text-xs text-muted-foreground">
                      （{row.doctorName ?? "担当医未設定"}）
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border bg-background px-4 py-3">
                    <div className="text-xs text-muted-foreground">呼び出し中</div>
                    <div className="mt-1 text-3xl font-semibold">
                      {row.current?.queueNumber ?? "-"}
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/20 px-4 py-3">
                    <div className="text-xs text-muted-foreground">次の番号</div>
                    <div className="mt-1 text-2xl font-semibold">
                      {row.next?.queueNumber ?? "-"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
