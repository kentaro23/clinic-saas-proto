import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getClinicIdFromRequest } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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
  const name = (body?.name as string | undefined)?.trim();
  const doctorName = (body?.doctorName as string | undefined)?.trim();

  const existing = await prisma.room.findUnique({ where: { id: params.id } });
  if (!existing || existing.clinicId !== clinicId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const room = await prisma.room.update({
    where: { id: params.id },
    data: {
      name: name || undefined,
      doctorName: doctorName || null
    }
  });

  return NextResponse.json({ room });
}
