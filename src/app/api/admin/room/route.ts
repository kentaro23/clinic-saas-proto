import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getClinicIdFromRequest } from "@/lib/admin";
import { getJstDayRange, getJstHour, toJstDateString } from "@/lib/dates";
import type { Reservation } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sendLinePush } from "@/lib/line";

type Direction = "next" | "prev";

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body?.action as string | undefined;
  const reservationId = body?.reservationId as string | undefined;
  const roomId = body?.roomId as string | undefined;
  const direction = body?.direction as Direction | undefined;
  const clinicId = await getClinicIdFromRequest(request, body ?? undefined);
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic not selected" }, { status: 403 });
  }

  if (!reservationId) {
    return NextResponse.json({ error: "reservationId required" }, { status: 400 });
  }
  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId }
  });
  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (reservation.clinicId !== clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }
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

  const sendMessage = async (target: Reservation, message: string) => {
    if (!target.lineUserId) return "line_mock";
    try {
      await sendLinePush(target.lineUserId, message, clinic.lineChannelAccessToken);
      return "line";
    } catch {
      return "line_mock";
    }
  };

  const notifyQueue = async (groupKeyValue: string) => {
    const latestReservations = await prisma.reservation.findMany({
      where: {
        clinicId: clinic.id,
        status: "booked",
        slotStart: {
          gte: start,
          lte: end
        }
      }
    });
    const latestGroup = latestReservations.filter(
      (item) => getKey(item.slotStart) === groupKeyValue && item.waitStatus !== "done"
    );
    const latestOrdered = [...latestGroup].sort((a, b) => {
      if (a.queueOrder != null && b.queueOrder != null) {
        return a.queueOrder - b.queueOrder;
      }
      if (a.queueNumber != null && b.queueNumber != null) {
        return a.queueNumber - b.queueNumber;
      }
      return a.slotStart.getTime() - b.slotStart.getTime();
    });

    for (let i = 0; i < latestOrdered.length; i += 1) {
      const positionAhead = i;
      const target = latestOrdered[i];
      if (!target.lineUserId) continue;

      if (positionAhead === 5 && !target.reminder5NotifiedAt) {
        const channel = await sendMessage(
          target,
          "あと5人で順番が近づきます。来院の準備をお願いします。"
        );
        await prisma.reservation.update({
          where: { id: target.id },
          data: { reminder5NotifiedAt: new Date() }
        });
        await prisma.messageLog.create({
          data: {
            reservationId: target.id,
            type: "reminder_5",
            channel,
            payload: JSON.stringify({ message: "あと5人通知" })
          }
        });
      }

      if (positionAhead === 3 && !target.reminder3NotifiedAt) {
        const channel = await sendMessage(
          target,
          "あと3人で順番が近づきます。院内でお待ちください。"
        );
        await prisma.reservation.update({
          where: { id: target.id },
          data: { reminder3NotifiedAt: new Date() }
        });
        await prisma.messageLog.create({
          data: {
            reservationId: target.id,
            type: "reminder_3",
            channel,
            payload: JSON.stringify({ message: "あと3人通知" })
          }
        });
      }
    }
  };

  const notifyCallNow = async (id: string) => {
    const target = await prisma.reservation.findUnique({ where: { id } });
    if (!target || !target.lineUserId || target.callNotifiedAt) {
      return;
    }
    const channel = await sendMessage(
      target,
      "診察の順番になりました。受付までお越しください。"
    );
    await prisma.reservation.update({
      where: { id: target.id },
      data: { callNotifiedAt: new Date() }
    });
    await prisma.messageLog.create({
      data: {
        reservationId: target.id,
        type: "call_now",
        channel,
        payload: JSON.stringify({ message: "呼び出し通知" })
      }
    });
  };

  if (action === "set-current") {
    const previousArrived = active.filter(
      (item) =>
        item.waitStatus === "arrived" &&
        item.currentRoomId === roomId &&
        item.id !== reservation.id
    );
    if (previousArrived.length > 0) {
      await prisma.reservation.updateMany({
        where: { id: { in: previousArrived.map((item) => item.id) } },
        data: { waitStatus: "done", currentRoomId: null }
      });
    }

    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { waitStatus: "arrived", arrivalStatus: "arrived", currentRoomId: roomId }
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

    await notifyCallNow(updated.id);
    await notifyQueue(groupKey);
    return NextResponse.json({ reservation: updated });
  }

  if (action === "shift") {
    if (!direction) {
      return NextResponse.json({ error: "direction required" }, { status: 400 });
    }

    const currentIndex = active.findIndex(
      (item) => item.id === reservation.id && item.currentRoomId === roomId
    );
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
      data: { waitStatus: "arrived", arrivalStatus: "arrived", currentRoomId: roomId }
    });
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { waitStatus: "done", currentRoomId: null }
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

    await notifyCallNow(target.id);
    await notifyQueue(groupKey);
    return NextResponse.json({ currentId: target.id });
  }

  if (action === "finish") {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { waitStatus: "done", currentRoomId: null }
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
    await notifyQueue(groupKey);
    return NextResponse.json({ currentId: null });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
