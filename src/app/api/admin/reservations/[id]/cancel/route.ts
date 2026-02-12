import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reservation = await prisma.reservation.update({
    where: { id: params.id },
    data: { status: "cancelled" }
  });

  await prisma.reservationLog.create({
    data: {
      reservationId: reservation.id,
      type: "cancel",
      payload: JSON.stringify({ by: "admin" })
    }
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
