import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = (body?.name as string | undefined)?.trim();
  const doctorName = (body?.doctorName as string | undefined)?.trim();

  const room = await prisma.room.update({
    where: { id: params.id },
    data: {
      name: name || undefined,
      doctorName: doctorName || null
    }
  });

  return NextResponse.json({ room });
}
