import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slotRuleSchema } from "@/lib/validators";

type Params = {
  params: { id: string };
};

export async function PUT(request: Request, { params }: Params) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = slotRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const rule = await prisma.slotRule.update({
    where: { id: params.id },
    data: parsed.data
  });

  return NextResponse.json({ rule });
}

export async function DELETE(_: Request, { params }: Params) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.slotRule.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
