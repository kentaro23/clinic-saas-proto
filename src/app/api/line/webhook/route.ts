import { NextResponse } from "next/server";

import { sendLineReply } from "@/lib/line";
import { prisma } from "@/lib/prisma";

const LIFF_URL =
  process.env.NEXT_PUBLIC_LIFF_URL ?? "https://liff.line.me/2009107688-2jho6SLa";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));

  const events = Array.isArray(payload?.events) ? payload.events : [];
  for (const event of events) {
    if (event?.type !== "message" || event?.message?.type !== "text") {
      continue;
    }

    const replyToken = event.replyToken as string | undefined;
    if (!replyToken) continue;

    const text = String(event.message.text ?? "").trim();
    const shouldReply = text.length === 0 || text.includes("予約");
    if (!shouldReply) continue;

    try {
      await sendLineReply(
        replyToken,
        `予約はこちらからお願いします：\n${LIFF_URL}`
      );
    } catch {
      // ignore reply errors to avoid webhook failures
    }
  }

  await prisma.messageLog.create({
    data: {
      reservationId: null,
      type: "confirm",
      channel: "line",
      payload: JSON.stringify(payload)
    }
  });

  return NextResponse.json({ ok: true });
}
