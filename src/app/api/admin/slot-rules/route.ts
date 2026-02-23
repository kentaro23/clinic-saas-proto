import { NextResponse } from "next/server";

import { getClinicIdFromRequest } from "@/lib/admin";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slotRuleSchema } from "@/lib/validators";

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clinicId = await getClinicIdFromRequest(request);
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic not selected" }, { status: 403 });
  }
  const rules = await prisma.slotRule.findMany({
    where: { clinicId },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }]
  });
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = slotRuleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const clinicId = await getClinicIdFromRequest(request, body ?? undefined);
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic not selected" }, { status: 403 });
  }

  const rule = await prisma.slotRule.create({
    data: {
      clinicId,
      ...parsed.data
    }
  });

  return NextResponse.json({ rule });
}
