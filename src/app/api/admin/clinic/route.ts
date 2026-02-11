import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getOrCreateClinic } from "@/lib/clinic";
import { prisma } from "@/lib/prisma";
import { clinicSettingsSchema } from "@/lib/validators";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinic = await getOrCreateClinic();

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

  const clinic = await getOrCreateClinic();

  const updated = await prisma.clinic.update({
    where: { id: clinic.id },
    data: parsed.data
  });

  return NextResponse.json({ clinic: updated });
}
