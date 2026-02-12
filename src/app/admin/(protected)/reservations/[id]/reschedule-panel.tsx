"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/format";
import { toDateOnlyString } from "@/lib/dates";

type Slot = {
  slotStart: string;
  remaining: number;
  capacity: number;
  label?: string | null;
};

export function ReschedulePanel({
  reservationId,
  currentSlotStart,
  disabled
}: {
  reservationId: string;
  currentSlotStart: Date;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [date, setDate] = useState(toDateOnlyString(currentSlotStart));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotMode, setSlotMode] = useState<"time" | "session">("time");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async (targetDate: string) => {
    setLoadingSlots(true);
    const response = await fetch(`/api/public/slots?date=${targetDate}`);
    const data = await response.json();
    setSlots(data.slots ?? []);
    setSlotMode(data.mode ?? "time");
    setLoadingSlots(false);
  };

  useEffect(() => {
    fetchSlots(date);
  }, [date]);

  useEffect(() => {
    if (slots.length === 0) return;
    const match = slots.find(
      (slot) =>
        new Date(slot.slotStart).getTime() === currentSlotStart.getTime()
    );
    setSelectedSlot(match ?? null);
  }, [slots, currentSlotStart]);

  const handleSubmit = async () => {
    if (!selectedSlot) {
      setError("変更先の枠を選択してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    const response = await fetch(
      `/api/admin/reservations/${reservationId}/reschedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotStart: selectedSlot.slotStart })
      }
    );
    setSubmitting(false);
    if (!response.ok) {
      setError("予約変更に失敗しました。別の枠を選択してください。");
      return;
    }
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>予約変更</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium">来院希望日</label>
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-9"
            disabled={disabled}
          />
        </div>
        {loadingSlots ? (
          <p className="text-sm text-muted-foreground">枠を取得中...</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">空き枠がありません。</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-4">
            {slots.map((slot) => {
              const timeLabel =
                slotMode === "session"
                  ? slot.label ?? "午前/午後"
                  : formatTime(new Date(slot.slotStart));
              const isDisabled = slot.remaining <= 0;
              const isSelected = selectedSlot?.slotStart === slot.slotStart;
              return (
                <button
                  key={slot.slotStart}
                  type="button"
                  disabled={disabled || isDisabled}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-md border px-3 py-2 text-sm transition ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input hover:bg-muted"
                  } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <div className="font-medium">{timeLabel}</div>
                  <div className="text-xs text-muted-foreground">
                    残り {slot.remaining}/{slot.capacity}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button onClick={handleSubmit} disabled={disabled || submitting}>
          {submitting ? "変更中..." : "予約を変更"}
        </Button>
      </CardContent>
    </Card>
  );
}
