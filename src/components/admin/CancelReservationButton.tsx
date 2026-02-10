"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type CancelReservationButtonProps = {
  reservationId: string;
  disabled?: boolean;
};

export function CancelReservationButton({
  reservationId,
  disabled,
}: CancelReservationButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    await fetch(`/api/admin/reservations/${reservationId}/cancel`, {
      method: "POST",
    });
    window.location.reload();
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={disabled || loading}
      onClick={handleCancel}
    >
      {loading ? "キャンセル中..." : "キャンセル"}
    </Button>
  );
}
