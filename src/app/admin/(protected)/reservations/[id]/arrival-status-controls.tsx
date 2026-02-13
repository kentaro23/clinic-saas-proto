"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function ArrivalStatusControls({
  reservationId,
  currentStatus
}: {
  reservationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChange = async (nextStatus: "arrived" | "not_arrived") => {
    if (nextStatus === currentStatus) return;
    setLoading(true);
    await fetch(`/api/admin/reservations/${reservationId}/arrival-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arrivalStatus: nextStatus })
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={`h-8 rounded-full px-3 text-xs font-medium ${
          currentStatus === "arrived"
            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
        }`}
        disabled={loading}
        onClick={() => handleChange("arrived")}
      >
        来院済み
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={`h-8 rounded-full px-3 text-xs font-medium ${
          currentStatus === "not_arrived"
            ? "border-slate-500 bg-slate-50 text-slate-700"
            : "border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
        disabled={loading}
        onClick={() => handleChange("not_arrived")}
      >
        未来院
      </Button>
    </div>
  );
}
