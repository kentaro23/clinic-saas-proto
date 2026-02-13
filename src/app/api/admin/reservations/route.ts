import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { getOrCreateClinic } from "@/lib/clinic";
import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { reservationCreateSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const dateStr = dateParam ?? toJstDateString(new Date());
  const { start, end } = getJstDayRange(dateStr);

  const reservations = await prisma.reservation.findMany({
    where: {
      slotStart: {
        gte: start,
        lte: end
      }
    },
    orderBy: { slotStart: "asc" },
    include: { intakeAnswer: true }
  });

  return NextResponse.json({ reservations });
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reservationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slotStart = new Date(parsed.data.slotStart);
  const dateStr = toJstDateString(slotStart);
  const { start, end } = getJstDayRange(dateStr);

  const queueNumber =
    (await prisma.reservation.count({
      where: {
        status: "booked",
        slotStart: {
          gte: start,
          lte: end
        }
      }
    })) + 1;
  const queueOrder =
    (await prisma.reservation.count({
      where: {
        status: "booked",
        slotStart
      }
    })) + 1;

  const clinic = await getOrCreateClinic();
  const reservation = await prisma.reservation.create({
    data: {
      clinicId: parsed.data.clinicId ?? clinic.id,
      patientName: parsed.data.patientName,
      patientPhone: normalizePhone(parsed.data.patientPhone),
      purpose: parsed.data.purpose,
      cardNumber: parsed.data.cardNumber?.trim() || null,
      lineUserId: parsed.data.lineUserId?.trim() || null,
      queueNumber,
      queueOrder,
      slotStart,
      waitStatus: "waiting",
      arrivalStatus: "not_arrived"
    }
  });

  return NextResponse.json({ reservation });
}
