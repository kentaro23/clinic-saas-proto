import { NextResponse } from "next/server";

import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const dateStr = dateParam ?? toJstDateString(new Date());
  const { start, end } = getJstDayRange(dateStr);

  const reservations = await prisma.reservation.findMany({
    where: {
      slotStart: {
        gte: start,
        lte: end
      }
    },
    orderBy: { slotStart: "asc" },
    include: { intakeAnswer: true }
  });

  return NextResponse.json({ reservations });
}
