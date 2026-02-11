import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getOrCreateClinic } from "@/lib/clinic";
import { prisma } from "@/lib/prisma";

type Params = {
  params: { id: string };
};

export async function DELETE(_: Request, { params }: Params) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.slotRuleTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function POST(_: Request, { params }: Params) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinic = await getOrCreateClinic();
  const template = await prisma.slotRuleTemplate.findUnique({
    where: { id: params.id }
  });

  if (!template || template.clinicId !== clinic.id) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const rules = Array.isArray(template.rules)
    ? template.rules.filter((rule) => rule != null)
    : [];
  if (rules.length === 0) {
    return NextResponse.json({ error: "Template empty" }, { status: 400 });
  }

  await prisma.slotRule.deleteMany({ where: { clinicId: clinic.id } });
  await prisma.slotRule.createMany({
    data: rules.map((rule) => ({
      clinicId: clinic.id,
      weekday: Number(rule.weekday),
      startTime: String(rule.startTime),
      endTime: String(rule.endTime),
      intervalMinutes: Number(rule.intervalMinutes),
      capacity: Number(rule.capacity)
    }))
  });

  return NextResponse.json({ ok: true });
}
