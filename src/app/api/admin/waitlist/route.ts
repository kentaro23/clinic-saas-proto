import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getClinicIdFromRequest } from "@/lib/admin";
import { getJstDayRange, getJstHour, toJstDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { calculateSlots } from "@/lib/slots";
import { calculateAverageWaitMinutes } from "@/lib/wait";

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const dateStr = dateParam ?? toJstDateString(new Date());
  const { start, end } = getJstDayRange(dateStr);

  const clinicId = await getClinicIdFromRequest(request);
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic not selected" }, { status: 403 });
  }
  const rules = await prisma.slotRule.findMany({
    where: { clinicId }
  });
  const reservations = await prisma.reservation.findMany({
    where: {
      clinicId,
      status: "booked",
      slotStart: {
        gte: start,
        lte: end
      }
    },
    orderBy: { slotStart: "asc" }
  });

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }
  const bookingMode = clinic.bookingMode === "session" ? "session" : "time";
  const slots = calculateSlots({
    date: new Date(),
    dateStr,
    rules,
    reservations,
    mode: bookingMode
  });
  const averageWaitMinutes = calculateAverageWaitMinutes(rules, dateStr);

  const isSessionMode = bookingMode === "session";
  const slotMap = new Map<string, typeof slots[0]>();
  slots.forEach((slot) => {
    const key = isSessionMode
      ? slot.label === "午前の部"
        ? "am"
        : "pm"
      : slot.slotStart.toISOString();
    slotMap.set(key, slot);
  });

  const reservationGroups = new Map<string, typeof reservations>();
  reservations.forEach((reservation) => {
    const key = isSessionMode
      ? getJstHour(reservation.slotStart) < 12
        ? "am"
        : "pm"
      : reservation.slotStart.toISOString();
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
      slotStart: slot?.slotStart.toISOString() ?? key,
      label:
        slot?.label ?? (isSessionMode ? (key === "am" ? "午前の部" : "午後の部") : null),
      capacity: slot?.capacity ?? groupReservations.length,
      remaining: slot?.remaining ?? 0,
      reservations: groupReservations.map((reservation) => ({
        id: reservation.id,
        patientName: reservation.patientName,
        patientPhone: reservation.patientPhone,
        queueNumber: reservation.queueNumber,
        queueOrder: reservation.queueOrder,
        waitStatus: reservation.waitStatus,
        arrivalStatus: reservation.arrivalStatus,
        currentRoomId: reservation.currentRoomId,
        estimatedWaitMinutes:
          Math.max((reservation.queueOrder ?? reservation.queueNumber ?? 1) - 1, 0) *
          averageWaitMinutes
      }))
    };
  });

  return NextResponse.json({
    date: dateStr,
    mode: bookingMode,
    slots: grouped
  });
}
