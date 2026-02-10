"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function CancelButton({
  reservationId,
  disabled
}: {
  reservationId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm("この予約をキャンセルしますか？")) {
      return;
    }
    setLoading(true);
    await fetch(`/api/admin/reservations/${reservationId}/cancel`, {
      method: "POST"
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <Button variant="destructive" onClick={handleCancel} disabled={disabled || loading}>
      {loading ? "処理中..." : "キャンセル"}
    </Button>
  );
}
