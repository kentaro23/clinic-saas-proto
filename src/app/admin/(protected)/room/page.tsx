"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const statusLabel = (status: string) => {
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

export default function AdminRoomPage() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<SlotGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

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

  const sortedSlots = useMemo(() => slots, [slots]);

  const setCurrent = async (reservationId: string) => {
    setWorking(true);
    await fetch("/api/admin/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-current", reservationId })
    });
    setWorking(false);
    await fetchWaitlist(date || undefined);
  };

  const shiftCurrent = async (reservationId: string, direction: "next" | "prev") => {
    setWorking(true);
    await fetch("/api/admin/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "shift", reservationId, direction })
    });
    setWorking(false);
    await fetchWaitlist(date || undefined);
  };

  const finishCurrent = async (reservationId: string) => {
    setWorking(true);
    await fetch("/api/admin/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "finish", reservationId })
    });
    setWorking(false);
    await fetchWaitlist(date || undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">診察室</h1>
          <p className="text-sm text-muted-foreground">
            診察中の患者を選択し、前後に進められます。
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
      ) : sortedSlots.length === 0 ? (
        <p className="text-sm text-muted-foreground">対象の枠がありません。</p>
      ) : (
        <div className="space-y-4">
          {sortedSlots.map((slot) => {
            const label = slot.label ?? formatTime(new Date(slot.slotStart));
            const activeList = slot.reservations.filter(
              (reservation) => reservation.waitStatus !== "done"
            );
            const currentIndex = activeList.findIndex(
              (reservation) => reservation.waitStatus === "arrived"
            );
            const current = currentIndex >= 0 ? activeList[currentIndex] : null;
            const prev = currentIndex > 0 ? activeList[currentIndex - 1] : null;
            const next =
              currentIndex >= 0 && currentIndex < activeList.length - 1
                ? activeList[currentIndex + 1]
                : null;

            return (
              <Card key={slot.slotStart}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {label}
                    <span className="ml-2 text-xs text-muted-foreground">
                      （残り {slot.remaining}/{slot.capacity}）
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border bg-muted/20 px-4 py-3">
                    <div className="text-sm font-medium">診察中</div>
                    {current ? (
                      <div className="mt-1 text-sm">
                        #{current.queueOrder ?? current.queueNumber}{" "}
                        {current.patientName}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        診察中の患者がいません。
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!current || !prev || working}
                        onClick={() => current && shiftCurrent(current.id, "prev")}
                      >
                        前の患者へ
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!current || !next || working}
                        onClick={() => current && shiftCurrent(current.id, "next")}
                      >
                        次の患者へ
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!current || working}
                        onClick={() => current && finishCurrent(current.id)}
                      >
                        診察を終了
                      </Button>
                    </div>
                  </div>

                  {slot.reservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">待ちがありません。</p>
                  ) : (
                    <div className="space-y-2">
                      {slot.reservations.map((reservation, index) => (
                        <div
                          key={reservation.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                        >
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              #{reservation.queueOrder ?? reservation.queueNumber ?? index + 1}
                            </span>{" "}
                            {reservation.patientName}（{reservation.patientPhone}）
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {statusLabel(reservation.waitStatus)}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={working}
                              onClick={() => setCurrent(reservation.id)}
                            >
                              診察中にする
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
