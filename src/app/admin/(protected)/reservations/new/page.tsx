"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatTime } from "@/lib/format";
import { toJstDateString } from "@/lib/dates";

type Slot = {
  slotStart: string;
  remaining: number;
  capacity: number;
  label?: string | null;
};

export default function AdminReservationNewPage() {
  const router = useRouter();
  const [date, setDate] = useState(toJstDateString(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientName: "",
    patientPhone: "",
    purpose: "first",
    cardNumber: ""
  });

  const fetchSlots = async (targetDate: string) => {
    setLoadingSlots(true);
    const response = await fetch(`/api/public/slots?date=${targetDate}`);
    const data = await response.json();
    setSlots(data.slots ?? []);
    setLoadingSlots(false);
  };

  useEffect(() => {
    fetchSlots(date);
    setSelectedSlot("");
  }, [date]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!selectedSlot) {
      setError("予約枠を選択してください。");
      return;
    }

    if (form.purpose === "followup" && !form.cardNumber.trim()) {
      setError("再診の場合は診察券番号を入力してください。");
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        slotStart: selectedSlot
      })
    });
    setSubmitting(false);

    if (!response.ok) {
      setError("予約作成に失敗しました。");
      return;
    }

    router.push("/admin/reservations");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">手動予約の作成</h1>
        <p className="text-sm text-muted-foreground">
          電話・来院などオンライン以外の予約を登録します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>予約情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">来院希望日</label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>

          {loadingSlots ? (
            <p className="text-sm text-muted-foreground">枠を取得中...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">空き枠がありません。</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {slots.map((slot) => {
                const timeLabel = slot.label ?? formatTime(new Date(slot.slotStart));
                const isDisabled = slot.remaining <= 0;
                const isSelected = selectedSlot === slot.slotStart;
                return (
                  <button
                    key={slot.slotStart}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSelectedSlot(slot.slotStart)}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>患者情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">氏名</label>
                <Input
                  value={form.patientName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, patientName: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">電話番号</label>
                <Input
                  value={form.patientPhone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, patientPhone: event.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">来院目的</label>
              <Select
                value={form.purpose}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    purpose: event.target.value,
                    cardNumber: event.target.value === "followup" ? prev.cardNumber : ""
                  }))
                }
                required
              >
                <option value="first">初診</option>
                <option value="followup">再診</option>
              </Select>
            </div>
            {form.purpose === "followup" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">診察券番号</label>
                <Input
                  value={form.cardNumber}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, cardNumber: event.target.value }))
                  }
                  required
                />
              </div>
            )}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "保存中..." : "予約を作成"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/admin/reservations")}
              >
                一覧に戻る
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
