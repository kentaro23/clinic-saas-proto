import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { endOfDay, startOfDay } from "@/lib/dates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const targetDate = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();

  const reservations = await prisma.reservation.findMany({
    where: {
      slotStart: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate)
      }
    },
    orderBy: { slotStart: "asc" },
    include: { intakeAnswer: true }
  });

  return NextResponse.json({ reservations });
}
