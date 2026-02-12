import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = {
  params: { id: string };
};

export async function POST(request: Request, { params }: Params) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const direction = body?.direction as "up" | "down" | undefined;
  if (!direction || (direction !== "up" && direction !== "down")) {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

  const current = await prisma.reservation.findUnique({
    where: { id: params.id }
  });
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sameSlot = await prisma.reservation.findMany({
    where: {
      status: "booked",
      slotStart: current.slotStart
    },
    orderBy: { slotStart: "asc" }
  });

  const normalized = sameSlot
    .slice()
    .sort((a, b) => {
      if (a.queueOrder != null && b.queueOrder != null) {
        return a.queueOrder - b.queueOrder;
      }
      if (a.queueNumber != null && b.queueNumber != null) {
        return a.queueNumber - b.queueNumber;
      }
      return a.slotStart.getTime() - b.slotStart.getTime();
    })
    .map((reservation, index) => ({
      ...reservation,
      normalizedOrder: reservation.queueOrder ?? index + 1
    }));

  const updates = normalized.filter(
    (reservation) => reservation.queueOrder !== reservation.normalizedOrder
  );
  if (updates.length > 0) {
    await Promise.all(
      updates.map((reservation) =>
        prisma.reservation.update({
          where: { id: reservation.id },
          data: { queueOrder: reservation.normalizedOrder }
        })
      )
    );
  }

  const currentIndex = normalized.findIndex(
    (reservation) => reservation.id === current.id
  );
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= normalized.length) {
    return NextResponse.json({ ok: true });
  }

  const currentOrder = normalized[currentIndex].normalizedOrder;
  const targetOrder = normalized[targetIndex].normalizedOrder;

  await Promise.all([
    prisma.reservation.update({
      where: { id: normalized[currentIndex].id },
      data: { queueOrder: targetOrder }
    }),
    prisma.reservation.update({
      where: { id: normalized[targetIndex].id },
      data: { queueOrder: currentOrder }
    })
  ]);

  return NextResponse.json({ ok: true });
}
