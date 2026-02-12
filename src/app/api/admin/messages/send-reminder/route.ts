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
  const dateStr = dateParam ?? toJstDateString(new Date());
  const { start, end } = getJstDayRange(dateStr);

  const reservations = await prisma.reservation.findMany({
    where: reservationIds.length > 0
      ? {
          id: { in: reservationIds },
          status: "booked"
        }
      : {
          status: "booked",
          slotStart: {
            gte: start,
            lte: end
          }
        }
  });

  const canPush = Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN);
  const targets = reservations.filter((reservation) => reservation.lineUserId);
  const results = await Promise.all(
    targets.map(async (reservation) => {
      try {
        if (canPush && reservation.lineUserId) {
          await sendLinePush(
            reservation.lineUserId,
            "ご予約のリマインドです。本日のご来院をお待ちしております。"
          );
          return { reservation, channel: "line" };
        }
      } catch {
        // fall through to mock
      }
      return { reservation, channel: "line_mock" };
    })
  );

  const logs = await prisma.messageLog.createMany({
    data: results.map(({ reservation, channel }) => ({
      reservationId: reservation.id,
      type: "reminder",
      channel,
      payload: JSON.stringify({
        message: "リマインド送信",
        reservationId: reservation.id
      })
    }))
  });

  return NextResponse.json({ sent: logs.count });
}
