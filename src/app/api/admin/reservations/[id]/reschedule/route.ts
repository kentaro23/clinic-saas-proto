import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { calculateSlots } from "@/lib/slots";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slotStart } = body ?? {};

  if (!slotStart) {
    return NextResponse.json({ error: "slotStart required" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id }
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (reservation.status !== "booked") {
    return NextResponse.json({ error: "Not active" }, { status: 409 });
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: reservation.clinicId }
  });
  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  const nextSlotStart = new Date(slotStart);
  if (Number.isNaN(nextSlotStart.getTime())) {
    return NextResponse.json({ error: "Invalid slotStart" }, { status: 400 });
  }

  const dateStr = toJstDateString(nextSlotStart);
  const { start: dayStart, end: dayEnd } = getJstDayRange(dateStr);
  const rules = await prisma.slotRule.findMany({
    where: { clinicId: clinic.id }
  });
  const reservations = await prisma.reservation.findMany({
    where: {
      clinicId: clinic.id,
      status: "booked",
      slotStart: {
        gte: dayStart,
        lte: dayEnd
      },
      NOT: { id: reservation.id }
    }
  });

  const bookingMode = clinic.bookingMode === "session" ? "session" : "time";
  const slots = calculateSlots({
    date: nextSlotStart,
    dateStr,
    rules,
    reservations,
    mode: bookingMode
  });
  const targetSlot = slots.find(
    (slot) => slot.slotStart.getTime() === nextSlotStart.getTime()
  );

  if (!targetSlot || targetSlot.remaining <= 0) {
    return NextResponse.json({ error: "Slot not available" }, { status: 409 });
  }

  const queueNumber = reservations.length + 1;
  const queueOrder =
    reservations.filter((r) => r.slotStart.getTime() === nextSlotStart.getTime())
      .length + 1;

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      slotStart: nextSlotStart,
      queueNumber,
      queueOrder
    }
  });

  return NextResponse.json({ reservation: updated });
}
