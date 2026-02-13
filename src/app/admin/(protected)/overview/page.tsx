"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTime, formatVisitPurpose } from "@/lib/format";

type ReservationRow = {
  id: string;
  patientName: string;
  patientPhone: string;
  purpose: string;
  slotStart: string;
  queueNumber: number | null;
  status: string;
  waitStatus: string;
  arrivalStatus: string;
  intakeAnswer?: { id: string } | null;
};

type WaitlistRow = {
  id: string;
  patientName: string;
  patientPhone: string;
  queueNumber: number | null;
  queueOrder: number | null;
  waitStatus: string;
  arrivalStatus: string;
  estimatedWaitMinutes: number;
};

type SlotGroup = {
  slotStart: string;
  label: string | null;
  capacity: number;
  remaining: number;
  reservations: WaitlistRow[];
};

export default function AdminOverviewPage() {
  const [date, setDate] = useState("");
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [slots, setSlots] = useState<SlotGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const waitStatusLabel = (status: string) => {
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
  const arrivalLabel = (status: string) =>
    status === "arrived" ? "来院済み" : "未来院";

  const statusOptions = [
    { value: "waiting", label: "待ち" },
    { value: "called", label: "呼出中" },
    { value: "arrived", label: "診察中" },
    { value: "done", label: "完了" }
  ];

  const fetchAll = async (targetDate?: string) => {
    setLoading(true);
    const params = targetDate ? `?date=${targetDate}` : "";
    const [reservationRes, waitlistRes] = await Promise.all([
      fetch(`/api/admin/reservations${params}`),
      fetch(`/api/admin/waitlist${params}`)
    ]);
    const reservationsData = await reservationRes.json();
    const waitlistData = await waitlistRes.json();
    setReservations(reservationsData.reservations ?? []);
    setSlots(waitlistData.slots ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleMove = async (id: string, direction: "up" | "down") => {
    await fetch(`/api/admin/reservations/${id}/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction })
    });
    await fetchAll(date || undefined);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/admin/reservations/${id}/wait-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitStatus: status })
    });
    await fetchAll(date || undefined);
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
    await fetchAll(date || undefined);
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    await fetch("/api/admin/reservations/wait-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationIds: selectedIds, waitStatus: status })
    });
    setBulkUpdating(false);
    setSelectedIds([]);
    await fetchAll(date || undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">予約・待ち一覧</h1>
          <p className="text-sm text-muted-foreground">
            予約と待ち状況を1ページで確認できます。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/reservations/new">手動予約を追加</Link>
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-9 w-44"
          />
          <Button type="button" size="sm" variant="outline" onClick={() => fetchAll(date || undefined)}>
            表示
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>予約一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">予約がありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>番号</TableHead>
                  <TableHead>時刻</TableHead>
                  <TableHead>患者</TableHead>
                  <TableHead>目的</TableHead>
                  <TableHead>問診</TableHead>
                  <TableHead>来院</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>{reservation.queueNumber ?? "-"}</TableCell>
                    <TableCell>{formatTime(new Date(reservation.slotStart))}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/reservations/${reservation.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {reservation.patientName}
                      </Link>
                    </TableCell>
                    <TableCell>{formatVisitPurpose(reservation.purpose)}</TableCell>
                    <TableCell>
                      <Badge variant={reservation.intakeAnswer ? "default" : "secondary"}>
                        {reservation.intakeAnswer ? "完了" : "未完了"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {arrivalLabel(reservation.arrivalStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {waitStatusLabel(reservation.waitStatus)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>待ち一覧</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={sending || selectedIds.length === 0}
              onClick={() => sendBulk("reminder")}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:border-border disabled:text-muted-foreground"
            >
              選択にリマインド
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={sending || selectedIds.length === 0}
              onClick={() => sendBulk("call")}
              className="border-sky-300 text-sky-700 hover:bg-sky-50 disabled:border-border disabled:text-muted-foreground"
            >
              選択に呼び出し
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-wrap items-center gap-1">
              {statusOptions.map((status) => (
                <Button
                  key={`bulk-${status.value}`}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bulkUpdating || selectedIds.length === 0}
                  onClick={() => bulkUpdateStatus(status.value)}
                  className="h-8 rounded-full px-3 text-xs font-medium"
                >
                  選択を{status.label}
                </Button>
              ))}
            </div>
          </div>

          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">対象の枠がありません。</p>
          ) : (
            <div className="space-y-4">
              {slots.map((slot) => {
                const label = slot.label ?? formatTime(new Date(slot.slotStart));
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
                        <p className="text-sm text-muted-foreground">待ちがありません。</p>
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
                              <span className="ml-2 text-xs text-muted-foreground">
                                目安 {reservation.estimatedWaitMinutes}分
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  aria-pressed={selectedIds.includes(reservation.id)}
                                  onClick={() => toggleSelection(reservation.id)}
                                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold transition ${
                                    selectedIds.includes(reservation.id)
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-input bg-background text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  {selectedIds.includes(reservation.id) ? "✓" : ""}
                                </button>
                                <span className="text-xs text-muted-foreground">選択</span>
                              </div>
                              <Separator orientation="vertical" className="h-6" />
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">来院</span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-xs ${
                                    reservation.arrivalStatus === "arrived"
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  {arrivalLabel(reservation.arrivalStatus)}
                                </span>
                              </div>
                              <Separator orientation="vertical" className="h-6" />
                              <div className="flex flex-wrap items-center gap-1">
                                {statusOptions.map((status) => {
                                  const isActive = reservation.waitStatus === status.value;
                                  const base =
                                    "h-8 rounded-full px-3 text-xs font-medium transition";
                                  const color =
                                    status.value === "waiting"
                                      ? isActive
                                        ? "border-amber-500 bg-amber-50 text-amber-700"
                                        : "border-amber-200 text-amber-700 hover:bg-amber-50"
                                      : status.value === "called"
                                        ? isActive
                                          ? "border-sky-500 bg-sky-50 text-sky-700"
                                          : "border-sky-200 text-sky-700 hover:bg-sky-50"
                                        : status.value === "arrived"
                                          ? isActive
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                          : isActive
                                            ? "border-slate-500 bg-slate-50 text-slate-700"
                                            : "border-slate-200 text-slate-700 hover:bg-slate-50";
                                  return (
                                    <Button
                                      key={status.value}
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className={`${base} ${color}`}
                                      onClick={() => handleStatusChange(reservation.id, status.value)}
                                    >
                                      {status.label}
                                    </Button>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-2">
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
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
