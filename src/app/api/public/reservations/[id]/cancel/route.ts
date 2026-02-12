import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { lineUserId } = body ?? {};

  if (!lineUserId) {
    return NextResponse.json({ error: "lineUserId required" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id }
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!reservation.lineUserId || reservation.lineUserId !== lineUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (reservation.status === "cancelled") {
    return NextResponse.json({ reservation });
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: "cancelled" }
  });

  return NextResponse.json({ reservation: updated });
}
