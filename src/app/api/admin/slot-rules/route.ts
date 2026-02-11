import { NextResponse } from "next/server";

import { getOrCreateClinic } from "@/lib/clinic";
import { prisma } from "@/lib/prisma";
import { slotRuleSchema } from "@/lib/validators";

export async function GET() {
  const clinic = await getOrCreateClinic();
  const rules = await prisma.slotRule.findMany({
    where: { clinicId: clinic.id },
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

  const clinic = await getOrCreateClinic();

  const rule = await prisma.slotRule.create({
    data: {
      clinicId: clinic.id,
      ...parsed.data
    }
  });

  return NextResponse.json({ rule });
}
