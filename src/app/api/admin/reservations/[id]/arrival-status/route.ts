import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getClinicIdFromRequest } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const allowedStatuses = new Set(["arrived", "not_arrived"]);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const clinicId = await getClinicIdFromRequest(request, body ?? undefined);
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic not selected" }, { status: 403 });
  }
  const nextStatus = body?.arrivalStatus as string | undefined;

  if (!nextStatus || !allowedStatuses.has(nextStatus)) {
    return NextResponse.json({ error: "Invalid arrivalStatus" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id }
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (reservation.clinicId !== clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { arrivalStatus: nextStatus }
  });

  await prisma.reservationLog.create({
    data: {
      reservationId: reservation.id,
      type: "arrival_status",
      payload: JSON.stringify({
        from: reservation.arrivalStatus,
        to: nextStatus,
        by: "admin"
      })
    }
  });

  return NextResponse.json({ reservation: updated });
}
