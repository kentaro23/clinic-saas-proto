"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type SendReminderButtonProps = {
  date?: string;
};

export function SendReminderButton({ date }: SendReminderButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    await fetch("/api/admin/messages/send-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    window.location.reload();
  };

  return (
    <Button onClick={handleSend} disabled={loading}>
      {loading ? "送信中..." : "今すぐリマインド送信"}
    </Button>
  );
}
