import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getOrCreateClinic } from "@/lib/clinic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinic = await getOrCreateClinic();
  const templates = await prisma.slotRuleTemplate.findMany({
    where: { clinicId: clinic.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name as string | undefined;
  const rules = body?.rules as unknown;

  if (!name || !Array.isArray(rules) || rules.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const clinic = await getOrCreateClinic();
  const template = await prisma.slotRuleTemplate.create({
    data: {
      clinicId: clinic.id,
      name,
      rules
    }
  });

  return NextResponse.json({ template });
}
