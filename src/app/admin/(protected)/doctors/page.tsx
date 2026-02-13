"use client";

import Link from "next/link";
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
  arrivalStatus: string;
  slotStart: string;
};

type DoctorCard = {
  roomId: string;
  roomName: string;
  doctorName: string | null;
  status: string;
  current: ReservationRow | null;
  patients: ReservationRow[];
};

export default function DoctorsPage() {
  const [date, setDate] = useState("");
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDoctors = async (targetDate?: string) => {
    setLoading(true);
    const params = targetDate ? `?date=${targetDate}` : "";
    const response = await fetch(`/api/admin/doctors${params}`);
    const data = await response.json();
    setDoctors(data.doctors ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">医師一覧</h1>
          <p className="text-sm text-muted-foreground">
            当日の担当医・診察状況を確認できます。
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
            onClick={() => fetchDoctors(date || undefined)}
          >
            表示
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : doctors.length === 0 ? (
        <p className="text-sm text-muted-foreground">診察室がありません。</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doctor) => (
            <Card key={doctor.roomId}>
              <CardHeader>
                <CardTitle className="text-base">
                  {doctor.doctorName ?? "担当医未設定"}
                  <span className="ml-2 text-xs text-muted-foreground">
                    （{doctor.roomName}）
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  ステータス: {doctor.status}
                </div>
                <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                  <div className="text-xs text-muted-foreground">診察中</div>
                  {doctor.current ? (
                    <div className="mt-1">
                      #{doctor.current.queueOrder ?? doctor.current.queueNumber ?? "-"}{" "}
                      {doctor.current.patientName}
                      <div className="text-xs text-muted-foreground">
                        {formatTime(new Date(doctor.current.slotStart))} / {doctor.current.patientPhone}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        来院: {doctor.current.arrivalStatus === "arrived" ? "済み" : "未来院"}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-muted-foreground">
                      診察中の患者はいません。
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">担当患者</div>
                  {doctor.patients.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      本日の担当患者がいません。
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {doctor.patients.map((patient) => (
                        <div key={patient.id} className="flex items-center justify-between text-sm">
                          <Link
                            href={`/admin/reservations/${patient.id}`}
                            className="text-primary hover:underline"
                          >
                            #{patient.queueOrder ?? patient.queueNumber ?? "-"} {patient.patientName}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(new Date(patient.slotStart))} /{" "}
                            {patient.arrivalStatus === "arrived" ? "来院済み" : "未来院"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
