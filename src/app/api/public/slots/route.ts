import { NextResponse } from "next/server";

import { getOrCreateClinic } from "@/lib/clinic";
import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { calculateSlots } from "@/lib/slots";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const dateStr = dateParam ?? toJstDateString(new Date());

  const clinic = await getOrCreateClinic();

  const rules = await prisma.slotRule.findMany({
    where: { clinicId: clinic.id }
  });

  const { start, end } = getJstDayRange(dateStr);
  const reservations = await prisma.reservation.findMany({
    where: {
      clinicId: clinic.id,
      slotStart: {
        gte: start,
        lte: end
      }
    }
  });

  const bookingMode = clinic.bookingMode === "session" ? "session" : "time";
  const slots = calculateSlots({
    date: new Date(),
    dateStr,
    rules,
    reservations,
    mode: bookingMode
  });

  return NextResponse.json({
    date: dateStr,
    mode: bookingMode,
    slots: slots.map((slot) => ({
      slotStart: slot.slotStart.toISOString(),
      remaining: slot.remaining,
      capacity: slot.capacity,
      label: slot.label ?? null
    }))
  });
}
