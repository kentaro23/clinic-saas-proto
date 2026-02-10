import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { calculateSlots } from "@/lib/slots";
import { startOfDay, endOfDay } from "@/lib/dates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const targetDate = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();

  const clinic = await prisma.clinic.findFirst();
  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  const rules = await prisma.slotRule.findMany({
    where: { clinicId: clinic.id }
  });

  const reservations = await prisma.reservation.findMany({
    where: {
      clinicId: clinic.id,
      slotStart: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate)
      }
    }
  });

  const bookingMode = clinic.bookingMode === "session" ? "session" : "time";
  const slots = calculateSlots({
    date: targetDate,
    rules,
    reservations,
    mode: bookingMode
  });

  return NextResponse.json({
    date: dateParam,
    mode: bookingMode,
    slots: slots.map((slot) => ({
      slotStart: slot.slotStart.toISOString(),
      remaining: slot.remaining,
      capacity: slot.capacity,
      label: slot.label ?? null
    }))
  });
}
