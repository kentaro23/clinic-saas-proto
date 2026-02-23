import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getClinicIdFromRequest } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = await getClinicIdFromRequest(request);
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic not selected" }, { status: 403 });
  }
  const templates = await prisma.slotRuleTemplate.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const clinicId = await getClinicIdFromRequest(request, body ?? undefined);
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic not selected" }, { status: 403 });
  }
  const name = body?.name as string | undefined;
  const rules = body?.rules as unknown;

  if (!name || !Array.isArray(rules) || rules.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const template = await prisma.slotRuleTemplate.create({
    data: {
      clinicId,
      name,
      rules
    }
  });

  return NextResponse.json({ template });
}
