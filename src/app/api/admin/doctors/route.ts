import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getOrCreateClinic } from "@/lib/clinic";
import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const dateStr = dateParam ?? toJstDateString(new Date());
  const { start, end } = getJstDayRange(dateStr);

  const clinic = await getOrCreateClinic();
  const rooms = await prisma.room.findMany({
    where: { clinicId: clinic.id },
    orderBy: { createdAt: "asc" }
  });

  const reservations = await prisma.reservation.findMany({
    where: {
      clinicId: clinic.id,
      status: "booked",
      slotStart: { gte: start, lte: end }
    },
    orderBy: { slotStart: "asc" }
  });

  const doctorCards = rooms.map((room) => {
    const roomReservations = reservations.filter(
      (reservation) => reservation.currentRoomId === room.id
    );
    const current = roomReservations.find(
      (reservation) => reservation.waitStatus === "arrived"
    );
    const status = current ? "診察中" : "休憩中";
    return {
      roomId: room.id,
      roomName: room.name,
      doctorName: room.doctorName,
      status,
      current,
      patients: roomReservations
    };
  });

  return NextResponse.json({ date: dateStr, doctors: doctorCards });
}
