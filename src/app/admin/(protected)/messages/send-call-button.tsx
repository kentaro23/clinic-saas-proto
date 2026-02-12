"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SendCallButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentNumber, setCurrentNumber] = useState("1");
  const [threshold, setThreshold] = useState("3");

  const handleSend = async () => {
    setLoading(true);
    await fetch("/api/admin/messages/send-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentNumber: Number(currentNumber),
        threshold: Number(threshold)
      })
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">現在番号</label>
        <Input
          type="number"
          min={1}
          value={currentNumber}
          onChange={(event) => setCurrentNumber(event.target.value)}
          className="h-9 w-24"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">通知範囲</label>
        <Input
          type="number"
          min={0}
          value={threshold}
          onChange={(event) => setThreshold(event.target.value)}
          className="h-9 w-24"
        />
      </div>
      <Button onClick={handleSend} disabled={loading} className="h-9">
        {loading ? "送信中..." : "呼び出し通知を送信"}
      </Button>
    </div>
  );
}
