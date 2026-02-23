"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ClinicSettings = {
  id: string;
  name: string;
  bookingMode: "time" | "session";
  lineChannelAccessToken: string | null;
  lineChannelSecret: string | null;
  liffBookingId: string | null;
  liffReservationsId: string | null;
};

export function ClinicSettingsForm() {
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/clinic");
      if (!res.ok) {
        setError("設定の取得に失敗しました。");
        return;
      }
      const data = await res.json();
      setClinic(data.clinic);
    };
    load().catch(() => setError("設定の取得に失敗しました。"));
  }, []);

  const updateField = (key: keyof ClinicSettings, value: string) => {
    if (!clinic) return;
    setClinic({ ...clinic, [key]: value });
  };

  const handleSave = async () => {
    if (!clinic) return;
    setSaving(true);
    setError(null);
    const payload = {
      bookingMode: clinic.bookingMode,
      lineChannelAccessToken: clinic.lineChannelAccessToken || null,
      lineChannelSecret: clinic.lineChannelSecret || null,
      liffBookingId: clinic.liffBookingId || null,
      liffReservationsId: clinic.liffReservationsId || null
    };
    const res = await fetch("/api/admin/clinic", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      setError("保存に失敗しました。");
    }
    setSaving(false);
  };

  if (!clinic) {
    return <div className="text-sm text-muted-foreground">読み込み中...</div>;
  }

  return (
    <Card className="p-6">
      <div className="space-y-5">
        <div>
          <Label>予約方式</Label>
          <Select
            className="mt-2 w-48"
            value={clinic.bookingMode}
            onChange={(event) =>
              updateField("bookingMode", event.target.value as ClinicSettings["bookingMode"])
            }
          >
            <option value="time">時間予約</option>
            <option value="session">午前/午後</option>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>LINE Channel Access Token</Label>
            <Input
              className="mt-2"
              value={clinic.lineChannelAccessToken ?? ""}
              onChange={(event) => updateField("lineChannelAccessToken", event.target.value)}
              placeholder="例: (長いトークン)"
            />
          </div>
          <div>
            <Label>LINE Channel Secret</Label>
            <Input
              className="mt-2"
              value={clinic.lineChannelSecret ?? ""}
              onChange={(event) => updateField("lineChannelSecret", event.target.value)}
              placeholder="例: (Channel Secret)"
            />
          </div>
          <div>
            <Label>LIFF 予約フォーム ID</Label>
            <Input
              className="mt-2"
              value={clinic.liffBookingId ?? ""}
              onChange={(event) => updateField("liffBookingId", event.target.value)}
              placeholder="例: 2000000000-xxxxxxxx"
            />
          </div>
          <div>
            <Label>LIFF 予約確認 ID</Label>
            <Input
              className="mt-2"
              value={clinic.liffReservationsId ?? ""}
              onChange={(event) => updateField("liffReservationsId", event.target.value)}
              placeholder="例: 2000000000-yyyyyyyy"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </Card>
  );
}
