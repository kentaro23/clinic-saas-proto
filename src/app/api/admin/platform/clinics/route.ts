import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { isSuperAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!isSuperAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinics = await prisma.clinic.findMany({
    orderBy: { createdAt: "desc" },
    include: { adminUsers: true }
  });
  return NextResponse.json({ clinics });
}

export async function POST(request: Request) {
  if (!isSuperAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const clinicName = (body?.clinicName as string | undefined)?.trim();
  const username = (body?.username as string | undefined)?.trim();
  const password = body?.password as string | undefined;
  const bookingMode = body?.bookingMode === "session" ? "session" : "time";
  const lineChannelAccessToken =
    (body?.lineChannelAccessToken as string | undefined)?.trim() || null;
  const lineChannelSecret =
    (body?.lineChannelSecret as string | undefined)?.trim() || null;
  const liffBookingId = (body?.liffBookingId as string | undefined)?.trim() || null;
  const liffReservationsId =
    (body?.liffReservationsId as string | undefined)?.trim() || null;

  if (!clinicName || !username || !password) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const passwordHash = await hash(password, 10);

  const clinic = await prisma.$transaction(async (tx) => {
    const createdClinic = await tx.clinic.create({
      data: {
        name: clinicName,
        bookingMode,
        lineChannelAccessToken,
        lineChannelSecret,
        liffBookingId,
        liffReservationsId
      }
    });
    await tx.adminUser.create({
      data: {
        clinicId: createdClinic.id,
        username,
        passwordHash,
        role: "clinic"
      }
    });
    return createdClinic;
  });

  return NextResponse.json({ clinic });
}
