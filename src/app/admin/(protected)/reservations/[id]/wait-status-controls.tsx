"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

const statusOptions = [
  { value: "waiting", label: "待ち" },
  { value: "called", label: "呼出中" },
  { value: "arrived", label: "診察中" },
  { value: "done", label: "完了" }
];

export function WaitStatusControls({
  reservationId,
  currentStatus
}: {
  reservationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChange = async (nextStatus: string) => {
    if (nextStatus === currentStatus) return;
    setLoading(true);
    await fetch(`/api/admin/reservations/${reservationId}/wait-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitStatus: nextStatus })
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {statusOptions.map((status) => {
        const isActive = currentStatus === status.value;
        const base = "h-8 rounded-full px-3 text-xs font-medium transition";
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
            disabled={loading}
            onClick={() => handleChange(status.value)}
          >
            {status.label}
          </Button>
        );
      })}
    </div>
  );
}
