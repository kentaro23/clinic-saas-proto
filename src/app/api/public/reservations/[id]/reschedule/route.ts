import { NextResponse } from "next/server";

import { getOrCreateClinic } from "@/lib/clinic";
import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { calculateSlots } from "@/lib/slots";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { slotStart, lineUserId } = body ?? {};

  if (!slotStart) {
    return NextResponse.json({ error: "slotStart required" }, { status: 400 });
  }
  if (!lineUserId) {
    return NextResponse.json({ error: "lineUserId required" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id }
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!reservation.lineUserId || reservation.lineUserId !== lineUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (reservation.status !== "booked") {
    return NextResponse.json({ error: "Not active" }, { status: 409 });
  }

  const clinic = reservation.clinicId
    ? await prisma.clinic.findUnique({ where: { id: reservation.clinicId } })
    : await getOrCreateClinic();
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
      queueOrder,
      waitStatus: "waiting"
    }
  });

  await prisma.reservationLog.create({
    data: {
      reservationId: reservation.id,
      type: "reschedule",
      payload: JSON.stringify({
        from: reservation.slotStart,
        to: nextSlotStart,
        by: "patient"
      })
    }
  });

  return NextResponse.json({ reservation: updated });
}
