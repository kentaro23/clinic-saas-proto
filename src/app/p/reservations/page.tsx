"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

type ReservationSummary = {
  id: string;
  patientName: string;
  slotStart: string;
  status: string;
  queueNumber: number | null;
  queuePosition: number | null;
  queueTotal: number | null;
};

declare global {
  interface Window {
    liff?: {
      init: (options: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      isInClient?: () => boolean;
      login: () => void;
      getProfile: () => Promise<{ userId: string }>;
    };
  }
}

export default function ReservationHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lineUserId, setLineUserId] = useState("");
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      const liffId =
        process.env.NEXT_PUBLIC_LIFF_RESERVATIONS_ID ??
        process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        setError("LINE内ブラウザからアクセスしてください。");
        setLoading(false);
        return;
      }
      try {
        await new Promise<void>((resolve, reject) => {
          const startedAt = Date.now();
          const timer = setInterval(() => {
            if (window.liff) {
              clearInterval(timer);
              resolve();
              return;
            }
            if (Date.now() - startedAt > 3000) {
              clearInterval(timer);
              reject(new Error("LIFF SDKが読み込めませんでした。"));
            }
          }, 100);
        });

        const liff = window.liff;
        if (!liff) {
          throw new Error("LIFF SDKが読み込めませんでした。");
        }
        await liff.init({ liffId });
        if (!liff.isLoggedIn() && !liff.isInClient?.()) {
          liff.login();
          return;
        }
        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
      } catch (err) {
        console.error("LIFF init failed", err);
        setError(`LINE連携の初期化に失敗しました。${err instanceof Error ? err.message : ""}`);
        setLoading(false);
      }
    };

    initLiff();
  }, []);

  useEffect(() => {
    if (!lineUserId) return;
    const fetchReservations = async () => {
      const response = await fetch(`/api/public/reservations?lineUserId=${lineUserId}`);
      const data = await response.json();
      setReservations(data.reservations ?? []);
      setLoading(false);
    };

    fetchReservations();
  }, [lineUserId]);

  const refreshReservations = async () => {
    if (!lineUserId) return;
    const response = await fetch(`/api/public/reservations?lineUserId=${lineUserId}`);
    const data = await response.json();
    setReservations(data.reservations ?? []);
  };

  const handleCancel = async (reservationId: string) => {
    if (!lineUserId) return;
    if (!confirm("この予約をキャンセルしますか？")) {
      return;
    }
    setActionId(reservationId);
    setActionError(null);
    const response = await fetch(`/api/public/reservations/${reservationId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineUserId })
    });
    setActionId(null);
    if (!response.ok) {
      setActionError("キャンセルに失敗しました。");
      return;
    }
    await refreshReservations();
  };

  const handleReschedule = (reservationId: string) => {
    router.push(`/p/booking?rescheduleId=${reservationId}`);
  };

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10">
      <Script src="https://static.line-scdn.net/liff/edge/2/sdk.js" strategy="beforeInteractive" />
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">予約確認</h1>
          <p className="text-sm text-muted-foreground">
            LINEで予約した内容と待ち状況を確認できます。
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : reservations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              予約が見つかりませんでした。
            </CardContent>
          </Card>
        ) : (
          reservations.map((reservation) => {
            const total = reservation.queueTotal ?? 0;
            const position = reservation.queuePosition ?? 0;
            const percent =
              total > 0 && position > 0 ? Math.round((position / total) * 100) : 0;
            return (
              <Card key={reservation.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {formatDateTime(new Date(reservation.slotStart))}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">氏名：</span>
                    {reservation.patientName}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">ステータス：</span>
                    {reservation.status === "cancelled" ? "キャンセル" : "予約済み"}
                  </div>
                  {total > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">待ち状況：</span>
                        全{total}人中 {position}番目
                      </div>
                      <div className="h-2 w-full rounded bg-muted">
                        <div
                          className="h-2 rounded bg-primary"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                  {actionError ? (
                    <p className="text-sm text-destructive">{actionError}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline">
                      <a href={`/p/intake/${reservation.id}`}>問診を確認・編集</a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleReschedule(reservation.id)}
                      disabled={reservation.status === "cancelled"}
                    >
                      予約を変更
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleCancel(reservation.id)}
                      disabled={reservation.status === "cancelled" || actionId === reservation.id}
                    >
                      {actionId === reservation.id ? "処理中..." : "キャンセル"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
