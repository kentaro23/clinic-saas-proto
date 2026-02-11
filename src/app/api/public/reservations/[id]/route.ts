import { NextResponse } from "next/server";

import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: { intakeAnswer: true }
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dateStr = toJstDateString(reservation.slotStart);
  const { start, end } = getJstDayRange(dateStr);
  const dayReservations = await prisma.reservation.findMany({
    where: {
      status: "booked",
      slotStart: {
        gte: start,
        lte: end
      }
    },
    select: { id: true, queueNumber: true, slotStart: true }
  });
  const sorted = [...dayReservations].sort((a, b) => {
    if (a.queueNumber != null && b.queueNumber != null) {
      return a.queueNumber - b.queueNumber;
    }
    return a.slotStart.getTime() - b.slotStart.getTime();
  });
  const queueTotal = sorted.length;
  const queuePosition =
    sorted.findIndex((entry) => entry.id === reservation.id) + 1;

  return NextResponse.json({
    reservation,
    queuePosition,
    queueTotal
  });
}
