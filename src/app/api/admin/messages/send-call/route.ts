import { NextResponse } from "next/server";

import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { isAdminAuthenticated } from "@/lib/auth";
import { sendLinePush } from "@/lib/line";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const dateParam = body?.date as string | undefined;
  const reservationIds = Array.isArray(body?.reservationIds)
    ? (body.reservationIds as string[])
    : [];
  const currentNumber = Number(body?.currentNumber ?? 0);
  const threshold = Number(body?.threshold ?? 3);
  const dateStr = dateParam ?? toJstDateString(new Date());
  const { start, end } = getJstDayRange(dateStr);

  const useSelection = reservationIds.length > 0;

  if (!useSelection && (!Number.isFinite(currentNumber) || currentNumber <= 0)) {
    return NextResponse.json({ error: "Invalid currentNumber" }, { status: 400 });
  }

  const rangeEnd = currentNumber + Math.max(threshold, 0);

  const reservations = await prisma.reservation.findMany({
    where: useSelection
      ? {
          id: { in: reservationIds },
          status: "booked",
          lineUserId: { not: null }
        }
      : {
          status: "booked",
          queueNumber: {
            gte: currentNumber,
            lte: rangeEnd
          },
          callNotifiedAt: null,
          slotStart: {
            gte: start,
            lte: end
          },
          lineUserId: { not: null }
        }
  });

  const notifiedIds: string[] = [];
  const logs: { reservationId: string; channel: string }[] = [];

  for (const reservation of reservations) {
    if (!reservation.lineUserId) continue;
    try {
      const message = useSelection
        ? `まもなくお呼び出し予定です。あなたの番号: ${reservation.queueNumber}`
        : `まもなくお呼び出し予定です。現在の番号: ${currentNumber} / あなたの番号: ${reservation.queueNumber}`;
      await sendLinePush(reservation.lineUserId, message);
      notifiedIds.push(reservation.id);
      logs.push({ reservationId: reservation.id, channel: "line" });
    } catch {
      logs.push({ reservationId: reservation.id, channel: "line_mock" });
    }
  }

  if (notifiedIds.length > 0) {
    await prisma.reservation.updateMany({
      where: { id: { in: notifiedIds } },
      data: { callNotifiedAt: new Date(), waitStatus: "called" }
    });
  }

  if (logs.length > 0) {
    await prisma.messageLog.createMany({
      data: logs.map((log) => ({
        reservationId: log.reservationId,
        type: "call_soon",
        channel: log.channel,
        payload: JSON.stringify({
          message: "呼び出し通知",
          currentNumber
        })
      }))
    });
  }

  return NextResponse.json({ sent: logs.length });
}
