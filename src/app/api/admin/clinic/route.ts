import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clinicSettingsSchema } from "@/lib/validators";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinic = await prisma.clinic.findFirst();
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

  const clinic = await prisma.clinic.findFirst();
  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  const updated = await prisma.clinic.update({
    where: { id: clinic.id },
    data: parsed.data
  });

  return NextResponse.json({ clinic: updated });
}
