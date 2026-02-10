"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function SendReminderButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    await fetch("/api/admin/messages/send-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <Button onClick={handleSend} disabled={loading}>
      {loading ? "送信中..." : "今すぐリマインド送信"}
    </Button>
  );
}
