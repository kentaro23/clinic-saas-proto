"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AdminUser = {
  id: string;
  username: string;
};

type Clinic = {
  id: string;
  name: string;
  bookingMode: "time" | "session";
  adminUsers: AdminUser[];
};

export function PlatformClinicForm() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [form, setForm] = useState({
    clinicName: "",
    username: "",
    password: "",
    bookingMode: "time" as "time" | "session",
    lineChannelAccessToken: "",
    lineChannelSecret: "",
    liffBookingId: "",
    liffReservationsId: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/platform/clinics");
    if (!res.ok) {
      setError("医院一覧の取得に失敗しました。");
      return;
    }
    const data = await res.json();
    setClinics(data.clinics ?? []);
  };

  useEffect(() => {
    load().catch(() => setError("医院一覧の取得に失敗しました。"));
  }, []);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.clinicName || !form.username || !form.password) {
      setError("医院名・ユーザー名・パスワードは必須です。");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/platform/clinics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (!res.ok) {
      setError("医院の作成に失敗しました。");
      setSaving(false);
      return;
    }
    setForm({
      clinicName: "",
      username: "",
      password: "",
      bookingMode: "time",
      lineChannelAccessToken: "",
      lineChannelSecret: "",
      liffBookingId: "",
      liffReservationsId: ""
    });
    await load();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>医院名</Label>
            <Input
              className="mt-2"
              value={form.clinicName}
              onChange={(event) => updateForm("clinicName", event.target.value)}
            />
          </div>
          <div>
            <Label>予約方式</Label>
            <Select
              value={form.bookingMode}
              onValueChange={(value) => updateForm("bookingMode", value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">時間予約</SelectItem>
                <SelectItem value="session">午前/午後</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>管理ユーザー名</Label>
            <Input
              className="mt-2"
              value={form.username}
              onChange={(event) => updateForm("username", event.target.value)}
            />
          </div>
          <div>
            <Label>管理パスワード</Label>
            <Input
              className="mt-2"
              type="password"
              value={form.password}
              onChange={(event) => updateForm("password", event.target.value)}
            />
          </div>
          <div>
            <Label>LINE Channel Access Token</Label>
            <Input
              className="mt-2"
              value={form.lineChannelAccessToken}
              onChange={(event) => updateForm("lineChannelAccessToken", event.target.value)}
            />
          </div>
          <div>
            <Label>LINE Channel Secret</Label>
            <Input
              className="mt-2"
              value={form.lineChannelSecret}
              onChange={(event) => updateForm("lineChannelSecret", event.target.value)}
            />
          </div>
          <div>
            <Label>LIFF 予約フォーム ID</Label>
            <Input
              className="mt-2"
              value={form.liffBookingId}
              onChange={(event) => updateForm("liffBookingId", event.target.value)}
            />
          </div>
          <div>
            <Label>LIFF 予約確認 ID</Label>
            <Input
              className="mt-2"
              value={form.liffReservationsId}
              onChange={(event) => updateForm("liffReservationsId", event.target.value)}
            />
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-4">
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "作成中..." : "医院を追加"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">登録済み医院</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>医院名</TableHead>
              <TableHead>予約方式</TableHead>
              <TableHead>管理ユーザー</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clinics.map((clinic) => (
              <TableRow key={clinic.id}>
                <TableCell>{clinic.name}</TableCell>
                <TableCell>
                  {clinic.bookingMode === "session" ? "午前/午後" : "時間予約"}
                </TableCell>
                <TableCell>
                  {clinic.adminUsers.map((user) => user.username).join(", ") || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
