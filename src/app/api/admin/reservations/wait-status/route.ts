import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedStatuses = new Set(["waiting", "called", "arrived", "done"]);

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const reservationIds = Array.isArray(body?.reservationIds)
    ? (body.reservationIds as string[])
    : [];
  const nextStatus = body?.waitStatus as string | undefined;

  if (!nextStatus || !allowedStatuses.has(nextStatus)) {
    return NextResponse.json({ error: "Invalid waitStatus" }, { status: 400 });
  }
  if (reservationIds.length === 0) {
    return NextResponse.json({ error: "reservationIds required" }, { status: 400 });
  }

  const reservations = await prisma.reservation.findMany({
    where: { id: { in: reservationIds } },
    select: { id: true, waitStatus: true }
  });

  if (reservations.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.reservation.updateMany({
    where: { id: { in: reservationIds } },
    data: { waitStatus: nextStatus }
  });

  await prisma.reservationLog.createMany({
    data: reservations.map((reservation) => ({
      reservationId: reservation.id,
      type: "wait_status",
      payload: JSON.stringify({
        from: reservation.waitStatus,
        to: nextStatus,
        by: "admin"
      })
    }))
  });

  return NextResponse.json({ updated: reservationIds.length });
}
