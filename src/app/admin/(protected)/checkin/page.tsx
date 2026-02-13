"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

declare global {
  // Minimal typing for BarcodeDetector
  interface BarcodeDetector {
    detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
  }
  interface Window {
    BarcodeDetector?: {
      new (options: { formats: string[] }): BarcodeDetector;
    };
  }
}

export default function AdminCheckinPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    return () => stopStream();
  }, []);

  const handleCheckin = async (reservationId: string) => {
    if (!reservationId) return;
    setError(null);
    setResult(null);
    const response = await fetch(`/api/public/checkin/${reservationId}`, {
      method: "POST"
    });
    if (!response.ok) {
      setError("チェックインに失敗しました。IDを確認してください。");
      return;
    }
    setResult("来院済みに更新しました。");
  };

  const startScan = async () => {
    if (!window.BarcodeDetector) {
      setError("この端末ではQR読み取りに対応していません。手入力をご利用ください。");
      return;
    }
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        const video = videoRef.current;
        if (video.readyState >= 2) {
          try {
            const codes = await detector.detect(video);
            const code = codes[0]?.rawValue;
            if (code) {
              stopStream();
              const reservationId = code.split("/").pop() ?? code;
              await handleCheckin(reservationId);
              return;
            }
          } catch {
            // ignore detection errors, keep scanning
          }
        }
        if (streamRef.current) {
          requestAnimationFrame(scan);
        }
      };
      requestAnimationFrame(scan);
    } catch {
      setError("カメラの起動に失敗しました。権限を確認してください。");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">受付チェックイン</h1>
        <p className="text-sm text-muted-foreground">
          QRを読み取ると来院済みに更新されます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QR読み取り</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={startScan} disabled={scanning}>
              カメラを起動
            </Button>
            <Button type="button" variant="outline" onClick={stopStream} disabled={!scanning}>
              停止
            </Button>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <video ref={videoRef} className="h-56 w-full rounded-md object-cover" />
            {!window.BarcodeDetector ? (
              <p className="mt-2 text-xs text-muted-foreground">
                この端末はQR読み取りに対応していません。
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>手入力</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="予約IDを貼り付け"
            value={manualId}
            onChange={(event) => setManualId(event.target.value)}
            className="w-72"
          />
          <Button type="button" onClick={() => handleCheckin(manualId.trim())}>
            チェックイン
          </Button>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {result ? <p className="text-sm text-emerald-700">{result}</p> : null}
    </div>
  );
}
