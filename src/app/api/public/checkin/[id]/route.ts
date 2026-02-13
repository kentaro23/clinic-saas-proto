import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id }
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (reservation.arrivalStatus === "arrived") {
    return NextResponse.json({ reservation });
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { arrivalStatus: "arrived" }
  });

  await prisma.reservationLog.create({
    data: {
      reservationId: reservation.id,
      type: "arrival_status",
      payload: JSON.stringify({
        from: reservation.arrivalStatus,
        to: "arrived",
        by: "checkin"
      })
    }
  });

  return NextResponse.json({ reservation: updated });
}
