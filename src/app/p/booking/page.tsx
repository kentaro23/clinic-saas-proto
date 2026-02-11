"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatTime } from "@/lib/format";
import { toDateOnlyString } from "@/lib/dates";

type Slot = {
  slotStart: string;
  remaining: number;
  capacity: number;
  label?: string | null;
};

declare global {
  interface Window {
    liff?: {
      init: (options: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: () => void;
      getProfile: () => Promise<{ userId: string }>;
    };
  }
}

export default function BookingPage() {
  const router = useRouter();
  const [date, setDate] = useState(toDateOnlyString(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotMode, setSlotMode] = useState<"time" | "session">("time");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({
    patientName: "",
    patientPhone: "",
    purpose: "first",
    cardNumber: "",
    lineUserId: ""
  });
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
    setSelectedSlot(null);
  }, [date]);

  useEffect(() => {
    const initLiff = async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId || !window.liff) return;
      try {
        await window.liff.init({ liffId });
        if (!window.liff.isLoggedIn()) {
          window.liff.login();
          return;
        }
        const profile = await window.liff.getProfile();
        setForm((prev) => ({ ...prev, lineUserId: profile.userId }));
      } catch (error) {
        console.error("LIFF init failed", error);
      }
    };

    initLiff();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!selectedSlot) {
      setError("希望枠を選択してください。");
      return;
    }

    if (form.purpose === "followup" && !form.cardNumber.trim()) {
      setError("再診の場合は診察券番号を入力してください。");
      return;
    }

    const response = await fetch("/api/public/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        slotStart: selectedSlot.slotStart
      })
    });

    if (!response.ok) {
      setError("予約作成に失敗しました。別の枠を選択してください。");
      return;
    }

    const data = await response.json();
    router.push(`/p/intake/${data.reservation.id}`);
  };

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10">
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="beforeInteractive"
      />
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">予約フォーム</h1>
          <p className="text-sm text-muted-foreground">
            希望日時を選択し、患者情報を入力してください。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>予約枠の選択</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium">来院希望日</label>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
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
                      disabled={isDisabled}
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
              <Button type="submit">予約して問診へ</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
