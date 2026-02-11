import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { reservationCreateSchema } from "@/lib/validators";
import { calculateSlots } from "@/lib/slots";
import { startOfDay, endOfDay } from "@/lib/dates";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = reservationCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const clinic =
    (parsed.data.clinicId &&
      (await prisma.clinic.findUnique({
        where: { id: parsed.data.clinicId }
      }))) ||
    (await prisma.clinic.findFirst());

  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  const slotStart = new Date(parsed.data.slotStart);
  const rules = await prisma.slotRule.findMany({
    where: { clinicId: clinic.id }
  });
  const reservations = await prisma.reservation.findMany({
    where: {
      clinicId: clinic.id,
      slotStart: {
        gte: startOfDay(slotStart),
        lte: endOfDay(slotStart)
      }
    }
  });

  const bookingMode = clinic.bookingMode === "session" ? "session" : "time";
  const slots = calculateSlots({
    date: slotStart,
    rules,
    reservations,
    mode: bookingMode
  });
  const targetSlot = slots.find(
    (slot) => slot.slotStart.getTime() === slotStart.getTime()
  );

  if (!targetSlot || targetSlot.remaining <= 0) {
    return NextResponse.json({ error: "Slot not available" }, { status: 409 });
  }

  const dayStart = startOfDay(slotStart);
  const dayEnd = endOfDay(slotStart);
  const queueNumber =
    (await prisma.reservation.count({
      where: {
        clinicId: clinic.id,
        status: "booked",
        slotStart: {
          gte: dayStart,
          lte: dayEnd
        }
      }
    })) + 1;

  const reservation = await prisma.reservation.create({
    data: {
      clinicId: clinic.id,
      patientName: parsed.data.patientName,
      patientPhone: parsed.data.patientPhone,
      purpose: parsed.data.purpose,
      cardNumber: parsed.data.cardNumber?.trim() || null,
      lineUserId: parsed.data.lineUserId?.trim() || null,
      queueNumber,
      slotStart
    }
  });

  return NextResponse.json({
    reservation,
    intakeUrl: `/p/intake/${reservation.id}`
  });
}
