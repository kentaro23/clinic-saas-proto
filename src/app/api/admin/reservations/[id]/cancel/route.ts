import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const reservation = await prisma.reservation.update({
    where: { id: params.id },
    data: { status: "cancelled" }
  });

  await prisma.messageLog.create({
    data: {
      reservationId: reservation.id,
      type: "cancel",
      channel: "line_mock",
      payload: JSON.stringify({
        message: "キャンセル通知を送信しました",
        reservationId: reservation.id
      })
    }
  });

  return NextResponse.json({ reservation });
}
