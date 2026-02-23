import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getClinicIdFromRequest } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = await getClinicIdFromRequest(request);
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic not selected" }, { status: 403 });
  }
  const existing = await prisma.reservation.findUnique({
    where: { id: params.id }
  });
  if (!existing || existing.clinicId !== clinicId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const reservation = await prisma.reservation.update({
    where: { id: params.id },
    data: { status: "cancelled" }
  });

  await prisma.reservationLog.create({
    data: {
      reservationId: reservation.id,
      type: "cancel",
      payload: JSON.stringify({ by: "admin" })
    }
  });

  await prisma.messageLog.create({
    data: {
      reservationId: reservation.id,
      type: "cancel",
      channel: "line_mock",
      payload: JSON.stringify({
        message: "キャンセル通知を送信しました",
        reservationId: reservation.id
      })
    }
  });

  return NextResponse.json({ reservation });
}
