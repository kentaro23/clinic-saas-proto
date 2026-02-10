"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";

type Reservation = {
  id: string;
  patientName: string;
  slotStart: string;
};

export default function IntakePage() {
  const params = useParams<{ reservationId: string }>();
  const reservationId = params?.reservationId as string;
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    symptoms: "",
    onset: "",
    history: "",
    medications: "",
    allergies: "",
    visitType: "first",
    cardNumber: "",
    notes: ""
  });

  useEffect(() => {
    const fetchReservation = async () => {
      const response = await fetch(`/api/public/reservations/${reservationId}`);
      const data = await response.json();
      setReservation(data);
      setLoading(false);
    };

    if (reservationId) {
      fetchReservation();
    }
  }, [reservationId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetch("/api/public/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId,
        answers: form
      })
    });
    setSubmitted(true);
  };

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">読み込み中...</p>;
  }

  if (!reservation) {
    return <p className="p-6 text-sm text-destructive">予約が見つかりません。</p>;
  }

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">事前問診フォーム</h1>
          <p className="text-sm text-muted-foreground">
            {reservation.patientName} 様 / {formatDateTime(new Date(reservation.slotStart))}
          </p>
        </div>

        {submitted ? (
          <Card>
            <CardHeader>
              <CardTitle>送信完了</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                問診内容を送信しました。ご来院をお待ちしております。
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>入力してください</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="text-sm font-medium">症状</label>
                  <Input
                    value={form.symptoms}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, symptoms: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">発症時期</label>
                  <Input
                    value={form.onset}
                    onChange={(event) => setForm((prev) => ({ ...prev, onset: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">既往歴</label>
                  <Textarea
                    value={form.history}
                    onChange={(event) => setForm((prev) => ({ ...prev, history: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">内服薬</label>
                  <Textarea
                    value={form.medications}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, medications: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">アレルギー</label>
                  <Textarea
                    value={form.allergies}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, allergies: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">来院目的</label>
                  <Select
                    value={form.visitType}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        visitType: event.target.value,
                        cardNumber: event.target.value === "followup" ? prev.cardNumber : ""
                      }))
                    }
                    required
                  >
                    <option value="first">初診</option>
                    <option value="followup">再診</option>
                  </Select>
                </div>
                {form.visitType === "followup" && (
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
                <div className="space-y-1">
                  <label className="text-sm font-medium">自由記述</label>
                  <Textarea
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </div>
                <Button type="submit">問診を送信</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
