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
  const rooms = await prisma.room.findMany({
    where: { clinicId },
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

  const clinicId = await getClinicIdFromRequest(request, body ?? undefined);
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic not selected" }, { status: 403 });
  }
  const room = await prisma.room.create({
    data: {
      clinicId,
      name,
      doctorName: doctorName || null
    }
  });

  return NextResponse.json({ room });
}
