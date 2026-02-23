import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getClinicIdFromRequest } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(
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
  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: { intakeAnswer: true, messageLogs: true }
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (reservation.clinicId !== clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ reservation });
}
