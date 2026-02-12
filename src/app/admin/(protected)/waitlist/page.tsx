"use client";

import { useEffect, useState } from "react";

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

export default function WaitlistPage() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<SlotGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const statusOptions = [
    { value: "waiting", label: "待ち" },
    { value: "called", label: "呼出中" },
    { value: "arrived", label: "来院済み" },
    { value: "done", label: "完了" }
  ];

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

  const handleMove = async (id: string, direction: "up" | "down") => {
    await fetch(`/api/admin/reservations/${id}/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction })
    });
    await fetchWaitlist(date || undefined);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/admin/reservations/${id}/wait-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitStatus: status })
    });
    await fetchWaitlist(date || undefined);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const sendBulk = async (type: "reminder" | "call") => {
    if (selectedIds.length === 0) return;
    setSending(true);
    const endpoint =
      type === "reminder"
        ? "/api/admin/messages/send-reminder"
        : "/api/admin/messages/send-call";
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationIds: selectedIds, date })
    });
    setSending(false);
    setSelectedIds([]);
    await fetchWaitlist(date || undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">待ち一覧</h1>
          <p className="text-sm text-muted-foreground">
            日付ごと・枠ごとの待ち状況と並び替えができます。
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
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={sending || selectedIds.length === 0}
            onClick={() => sendBulk("reminder")}
          >
            選択にリマインド
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={sending || selectedIds.length === 0}
            onClick={() => sendBulk("call")}
          >
            選択に呼び出し
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">対象の枠がありません。</p>
      ) : (
        <div className="space-y-4">
          {slots.map((slot) => {
            const label =
              slot.label ?? formatTime(new Date(slot.slotStart));
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
                <CardContent className="space-y-2">
                  {slot.reservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      待ちがありません。
                    </p>
                  ) : (
                    slot.reservations.map((reservation, index) => (
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedIds.includes(reservation.id) ? "default" : "outline"}
                          onClick={() => toggleSelection(reservation.id)}
                        >
                          {selectedIds.includes(reservation.id) ? "選択中" : "選択"}
                        </Button>
                        <div className="flex flex-wrap items-center gap-1">
                          {statusOptions.map((status) => (
                            <Button
                              key={status.value}
                              type="button"
                              size="sm"
                              variant={
                                reservation.waitStatus === status.value
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                handleStatusChange(reservation.id, status.value)
                              }
                            >
                              {status.label}
                            </Button>
                          ))}
                        </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleMove(reservation.id, "up")}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleMove(reservation.id, "down")}
                            disabled={index === slot.reservations.length - 1}
                          >
                            ↓
                          </Button>
                        </div>
                      </div>
                    ))
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
