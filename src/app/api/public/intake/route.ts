import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { intakeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = intakeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: parsed.data.reservationId }
  });

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const intake = await prisma.intakeAnswer.upsert({
    where: { reservationId: reservation.id },
    update: { answers: JSON.stringify(parsed.data.answers) },
    create: {
      reservationId: reservation.id,
      answers: JSON.stringify(parsed.data.answers)
    }
  });

  return NextResponse.json({ intake });
}
