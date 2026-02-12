import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getOrCreateClinic } from "@/lib/clinic";
import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { calculateSlots } from "@/lib/slots";

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const dateStr = dateParam ?? toJstDateString(new Date());
  const { start, end } = getJstDayRange(dateStr);

  const clinic = await getOrCreateClinic();
  const rules = await prisma.slotRule.findMany({
    where: { clinicId: clinic.id }
  });
  const reservations = await prisma.reservation.findMany({
    where: {
      clinicId: clinic.id,
      status: "booked",
      slotStart: {
        gte: start,
        lte: end
      }
    },
    orderBy: { slotStart: "asc" }
  });

  const bookingMode = clinic.bookingMode === "session" ? "session" : "time";
  const slots = calculateSlots({
    date: new Date(),
    dateStr,
    rules,
    reservations,
    mode: bookingMode
  });

  const slotMap = new Map<string, typeof slots[0]>();
  slots.forEach((slot) => slotMap.set(slot.slotStart.toISOString(), slot));

  const reservationGroups = new Map<string, typeof reservations>();
  reservations.forEach((reservation) => {
    const key = reservation.slotStart.toISOString();
    const group = reservationGroups.get(key) ?? [];
    group.push(reservation);
    reservationGroups.set(key, group);
  });

  const allKeys = Array.from(
    new Set([...slotMap.keys(), ...reservationGroups.keys()])
  ).sort();

  const grouped = allKeys.map((key) => {
    const slot = slotMap.get(key);
    const groupReservations = (reservationGroups.get(key) ?? []).sort(
      (a, b) => {
        if (a.queueOrder != null && b.queueOrder != null) {
          return a.queueOrder - b.queueOrder;
        }
        if (a.queueNumber != null && b.queueNumber != null) {
          return a.queueNumber - b.queueNumber;
        }
        return a.slotStart.getTime() - b.slotStart.getTime();
      }
    );

    return {
      slotStart: key,
      label: slot?.label ?? null,
      capacity: slot?.capacity ?? groupReservations.length,
      remaining: slot?.remaining ?? 0,
      reservations: groupReservations.map((reservation) => ({
        id: reservation.id,
        patientName: reservation.patientName,
        patientPhone: reservation.patientPhone,
        queueNumber: reservation.queueNumber,
        queueOrder: reservation.queueOrder
      }))
    };
  });

  return NextResponse.json({
    date: dateStr,
    mode: bookingMode,
    slots: grouped
  });
}
