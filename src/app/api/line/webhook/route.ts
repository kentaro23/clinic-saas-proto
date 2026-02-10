import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const reservationId = payload?.reservationId as string | undefined;

  await prisma.messageLog.create({
    data: {
      reservationId: reservationId ?? null,
      type: "confirm",
      channel: "line_mock",
      payload: JSON.stringify(payload)
    }
  });

  return NextResponse.json({
    ok: true,
    intakeUrl: reservationId ? `/p/intake/${reservationId}` : null
  });
}
