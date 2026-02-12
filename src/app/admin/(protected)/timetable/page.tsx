"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/format";

type ReservationRow = {
  id: string;
  patientName: string;
  patientPhone: string;
  queueNumber: number | null;
  queueOrder: number | null;
  waitStatus: string;
};

type SlotGroup = {
  slotStart: string;
  label: string | null;
  capacity: number;
  remaining: number;
  reservations: ReservationRow[];
};

const statusStyle = (status: string) => {
  switch (status) {
    case "waiting":
      return "border-amber-300 text-amber-700 bg-amber-50";
    case "called":
      return "border-sky-300 text-sky-700 bg-sky-50";
    case "arrived":
      return "border-emerald-300 text-emerald-700 bg-emerald-50";
    case "done":
      return "border-slate-300 text-slate-700 bg-slate-50";
    default:
      return "border-border text-foreground bg-background";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "waiting":
      return "待ち";
    case "called":
      return "呼出中";
    case "arrived":
      return "来院済み";
    case "done":
      return "完了";
    default:
      return status;
  }
};

export default function WaitlistTimetablePage() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<SlotGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWaitlist = async (targetDate?: string) => {
    setLoading(true);
    const params = targetDate ? `?date=${targetDate}` : "";
    const response = await fetch(`/api/admin/waitlist${params}`);
    const data = await response.json();
    setSlots(data.slots ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const columns = useMemo(() => slots, [slots]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">タイムテーブル</h1>
          <p className="text-sm text-muted-foreground">
            時間帯ごとの待ち人数と順番を一覧で確認できます。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-9 w-44"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fetchWaitlist(date || undefined)}
          >
            表示
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : columns.length === 0 ? (
        <p className="text-sm text-muted-foreground">対象の枠がありません。</p>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[760px] border border-border bg-background"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(200px, 1fr))` }}
          >
            {columns.map((slot, columnIndex) => {
              const label = slot.label ?? formatTime(new Date(slot.slotStart));
              return (
                <div
                  key={slot.slotStart}
                  className={`min-h-[260px] ${columnIndex > 0 ? "border-l" : ""}`}
                >
                  <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="text-xs text-muted-foreground">
                      残り {slot.remaining}/{slot.capacity}
                    </div>
                  </div>
                  <div className="space-y-3 px-4 py-3">
                    {slot.reservations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">待ちがありません。</p>
                    ) : (
                      slot.reservations.map((reservation, index) => {
                        const order =
                          reservation.queueOrder ?? reservation.queueNumber ?? index + 1;
                        const offset = Math.min(index, 6) * 12;
                        return (
                          <div
                            key={reservation.id}
                            className="rounded-md border bg-muted/30 px-3 py-2 text-xs"
                            style={{ marginLeft: `${offset}px` }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">
                                #{order} {reservation.patientName}
                              </span>
                              <span
                                className={`rounded-full border px-2 py-0.5 ${statusStyle(
                                  reservation.waitStatus
                                )}`}
                              >
                                {statusLabel(reservation.waitStatus)}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {reservation.patientPhone}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Button asChild size="sm" variant="outline" className="h-7">
                                <Link href={`/admin/reservations/${reservation.id}`}>
                                  詳細/ステータス
                                </Link>
                              </Button>
                              <Button asChild size="sm" variant="outline" className="h-7">
                                <Link href={`/p/intake/${reservation.id}`}>問診</Link>
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
