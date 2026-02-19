import { NextResponse } from "next/server";

import { getOrCreateClinic } from "@/lib/clinic";
import { getJstDayRange, getJstHour, toJstDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clinic = await getOrCreateClinic();
  const dateStr = toJstDateString(new Date());
  const { start, end } = getJstDayRange(dateStr);

  const rooms = await prisma.room.findMany({
    where: { clinicId: clinic.id },
    orderBy: { createdAt: "asc" }
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
  const getKey = (slotStart: Date) =>
    bookingMode === "session"
      ? getJstHour(slotStart) < 12
        ? "am"
        : "pm"
      : slotStart.toISOString();

  const callboard = rooms.map((room) => {
    const current = reservations.find(
      (reservation) =>
        reservation.waitStatus === "arrived" && reservation.currentRoomId === room.id
    );

    let next: typeof reservations[0] | null = null;
    if (current) {
      const key = getKey(current.slotStart);
      const group = reservations.filter(
        (reservation) => getKey(reservation.slotStart) === key
      );
      const ordered = [...group].filter((r) => r.waitStatus !== "done").sort((a, b) => {
        if (a.queueOrder != null && b.queueOrder != null) {
          return a.queueOrder - b.queueOrder;
        }
        if (a.queueNumber != null && b.queueNumber != null) {
          return a.queueNumber - b.queueNumber;
        }
        return a.slotStart.getTime() - b.slotStart.getTime();
      });
      const currentIndex = ordered.findIndex((r) => r.id === current.id);
      if (currentIndex >= 0 && currentIndex < ordered.length - 1) {
        next = ordered[currentIndex + 1];
      }
    } else {
      const pending = reservations
        .filter((r) => r.waitStatus !== "done")
        .sort((a, b) => {
          if (a.queueOrder != null && b.queueOrder != null) {
            return a.queueOrder - b.queueOrder;
          }
          if (a.queueNumber != null && b.queueNumber != null) {
            return a.queueNumber - b.queueNumber;
          }
          return a.slotStart.getTime() - b.slotStart.getTime();
        });
      next = pending[0] ?? null;
    }

    return {
      roomId: room.id,
      roomName: room.name,
      doctorName: room.doctorName,
      current: current
        ? {
            id: current.id,
            queueNumber: current.queueOrder ?? current.queueNumber ?? null,
            patientName: current.patientName
          }
        : null,
      next: next
        ? {
            id: next.id,
            queueNumber: next.queueOrder ?? next.queueNumber ?? null,
            patientName: next.patientName
          }
        : null
    };
  });

  return NextResponse.json({ date: dateStr, callboard });
}
