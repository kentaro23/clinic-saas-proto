import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getOrCreateClinic } from "@/lib/clinic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinic = await getOrCreateClinic();
  const rooms = await prisma.room.findMany({
    where: { clinicId: clinic.id },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = (body?.name as string | undefined)?.trim();
  const doctorName = (body?.doctorName as string | undefined)?.trim();

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const clinic = await getOrCreateClinic();
  const room = await prisma.room.create({
    data: {
      clinicId: clinic.id,
      name,
      doctorName: doctorName || null
    }
  });

  return NextResponse.json({ room });
}
