import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getOrCreateClinic } from "@/lib/clinic";
import { getJstDayRange, getJstHour, toJstDateString } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

type Direction = "next" | "prev";

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body?.action as string | undefined;
  const reservationId = body?.reservationId as string | undefined;
  const direction = body?.direction as Direction | undefined;

  if (!reservationId) {
    return NextResponse.json({ error: "reservationId required" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId }
  });
  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const clinic =
    (reservation.clinicId &&
      (await prisma.clinic.findUnique({ where: { id: reservation.clinicId } }))) ||
    (await getOrCreateClinic());
  const bookingMode = clinic.bookingMode === "session" ? "session" : "time";
  const isSessionMode = bookingMode === "session";

  const dateStr = toJstDateString(reservation.slotStart);
  const { start, end } = getJstDayRange(dateStr);
  const dayReservations = await prisma.reservation.findMany({
    where: {
      clinicId: clinic.id,
      status: "booked",
      slotStart: {
        gte: start,
        lte: end
      }
    }
  });

  const getKey = (slotStart: Date) =>
    isSessionMode ? (getJstHour(slotStart) < 12 ? "am" : "pm") : slotStart.toISOString();
  const groupKey = getKey(reservation.slotStart);
  const group = dayReservations.filter((item) => getKey(item.slotStart) === groupKey);
  const ordered = [...group].sort((a, b) => {
    if (a.queueOrder != null && b.queueOrder != null) {
      return a.queueOrder - b.queueOrder;
    }
    if (a.queueNumber != null && b.queueNumber != null) {
      return a.queueNumber - b.queueNumber;
    }
    return a.slotStart.getTime() - b.slotStart.getTime();
  });
  const active = ordered.filter((item) => item.waitStatus !== "done");

  if (action === "set-current") {
    const previousArrived = active.filter(
      (item) => item.waitStatus === "arrived" && item.id !== reservation.id
    );
    if (previousArrived.length > 0) {
      await prisma.reservation.updateMany({
        where: { id: { in: previousArrived.map((item) => item.id) } },
        data: { waitStatus: "done" }
      });
    }

    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { waitStatus: "arrived" }
    });

    const logs = [
      ...previousArrived.map((item) => ({
        reservationId: item.id,
        type: "wait_status",
        payload: JSON.stringify({ from: item.waitStatus, to: "done", by: "admin" })
      })),
      {
        reservationId: reservation.id,
        type: "wait_status",
        payload: JSON.stringify({
          from: reservation.waitStatus,
          to: "arrived",
          by: "admin"
        })
      }
    ];
    await prisma.reservationLog.createMany({ data: logs });

    return NextResponse.json({ reservation: updated });
  }

  if (action === "shift") {
    if (!direction) {
      return NextResponse.json({ error: "direction required" }, { status: 400 });
    }

    const currentIndex = active.findIndex((item) => item.id === reservation.id);
    if (currentIndex < 0) {
      return NextResponse.json({ error: "Current not found" }, { status: 404 });
    }
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    const target = active[nextIndex];
    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    await prisma.reservation.updateMany({
      where: { id: { in: [reservation.id, target.id] } },
      data: { waitStatus: "arrived" }
    });
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { waitStatus: "done" }
    });

    await prisma.reservationLog.createMany({
      data: [
        {
          reservationId: reservation.id,
          type: "wait_status",
          payload: JSON.stringify({
            from: reservation.waitStatus,
            to: "done",
            by: "admin"
          })
        },
        {
          reservationId: target.id,
          type: "wait_status",
          payload: JSON.stringify({
            from: target.waitStatus,
            to: "arrived",
            by: "admin"
          })
        }
      ]
    });

    return NextResponse.json({ currentId: target.id });
  }

  if (action === "finish") {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { waitStatus: "done" }
    });
    await prisma.reservationLog.create({
      data: {
        reservationId: reservation.id,
        type: "wait_status",
        payload: JSON.stringify({
          from: reservation.waitStatus,
          to: "done",
          by: "admin"
        })
      }
    });
    return NextResponse.json({ currentId: null });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
