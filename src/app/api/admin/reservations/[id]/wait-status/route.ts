import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedStatuses = new Set(["waiting", "called", "arrived", "done"]);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const nextStatus = body?.waitStatus as string | undefined;

  if (!nextStatus || !allowedStatuses.has(nextStatus)) {
    return NextResponse.json({ error: "Invalid waitStatus" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id }
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { waitStatus: nextStatus }
  });

  await prisma.reservationLog.create({
    data: {
      reservationId: reservation.id,
      type: "wait_status",
      payload: JSON.stringify({
        from: reservation.waitStatus,
        to: nextStatus,
        by: "admin"
      })
    }
  });

  return NextResponse.json({ reservation: updated });
}
