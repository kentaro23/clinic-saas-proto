"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckinPage() {
  const params = useParams<{ reservationId: string }>();
  const reservationId = params?.reservationId as string;
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!reservationId) return;
      try {
        const response = await fetch(`/api/public/checkin/${reservationId}`, {
          method: "POST"
        });
        if (!response.ok) {
          setError("チェックインに失敗しました。受付でお声がけください。");
          setLoading(false);
          return;
        }
        setOk(true);
      } catch {
        setError("チェックインに失敗しました。受付でお声がけください。");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [reservationId]);

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto max-w-md">
        {loading ? (
          <p className="text-sm text-muted-foreground">チェックイン中...</p>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>チェックイン完了</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              受付が完了しました。お呼び出しまでお待ちください。
              {ok ? null : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
