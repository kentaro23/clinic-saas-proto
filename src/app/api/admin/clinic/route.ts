import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getClinicIdFromRequest } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { clinicSettingsSchema } from "@/lib/validators";

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = await getClinicIdFromRequest(request);
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic not selected" }, { status: 403 });
  }
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  return NextResponse.json({ clinic });
}

export async function PUT(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = clinicSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const clinicId = await getClinicIdFromRequest(request, body ?? undefined);
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic not selected" }, { status: 403 });
  }

  const updated = await prisma.clinic.update({
    where: { id: clinicId },
    data: parsed.data
  });

  return NextResponse.json({ clinic: updated });
}
