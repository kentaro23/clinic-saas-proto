import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { endOfDay, startOfDay } from "@/lib/dates";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const dateParam = body?.date as string | undefined;
  const targetDate = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();

  const reservations = await prisma.reservation.findMany({
    where: {
      status: "booked",
      slotStart: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate)
      }
    }
  });

  const logs = await prisma.messageLog.createMany({
    data: reservations.map((reservation) => ({
      reservationId: reservation.id,
      type: "reminder",
      channel: "line_mock",
      payload: JSON.stringify({
        message: "リマインド送信",
        reservationId: reservation.id
      })
    }))
  });

  return NextResponse.json({ sent: logs.count });
}
