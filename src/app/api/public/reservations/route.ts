import { NextResponse } from "next/server";

import { getOrCreateClinic } from "@/lib/clinic";
import { getJstDayRange, toJstDateString } from "@/lib/dates";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { calculateSlots } from "@/lib/slots";
import { calculateAverageWaitMinutes } from "@/lib/wait";
import { reservationCreateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = reservationCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const clinic =
    (parsed.data.clinicId &&
      (await prisma.clinic.findUnique({
        where: { id: parsed.data.clinicId }
      }))) ||
    (await getOrCreateClinic());

  const slotStart = new Date(parsed.data.slotStart);
  const dateStr = toJstDateString(slotStart);
  const { start: dayStart, end: dayEnd } = getJstDayRange(dateStr);
  const rules = await prisma.slotRule.findMany({
    where: { clinicId: clinic.id }
  });
  const reservations = await prisma.reservation.findMany({
    where: {
      clinicId: clinic.id,
      slotStart: {
        gte: dayStart,
        lte: dayEnd
      }
    }
  });

  const bookingMode = clinic.bookingMode === "session" ? "session" : "time";
  const slots = calculateSlots({
    date: slotStart,
    dateStr,
    rules,
    reservations,
    mode: bookingMode
  });
  const targetSlot = slots.find(
    (slot) => slot.slotStart.getTime() === slotStart.getTime()
  );

  if (!targetSlot || targetSlot.remaining <= 0) {
    return NextResponse.json({ error: "Slot not available" }, { status: 409 });
  }

  const queueNumber =
    (await prisma.reservation.count({
      where: {
        clinicId: clinic.id,
        status: "booked",
        slotStart: {
          gte: dayStart,
          lte: dayEnd
        }
      }
    })) + 1;
  const queueOrder =
    (await prisma.reservation.count({
      where: {
        clinicId: clinic.id,
        status: "booked",
        slotStart
      }
    })) + 1;

  const reservation = await prisma.reservation.create({
    data: {
      clinicId: clinic.id,
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

  return NextResponse.json({
    reservation,
    intakeUrl: `/p/intake/${reservation.id}`
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lineUserId = searchParams.get("lineUserId");

  if (!lineUserId) {
    return NextResponse.json({ error: "lineUserId required" }, { status: 400 });
  }

  let reservations = await prisma.reservation.findMany({
    where: { lineUserId },
    orderBy: { slotStart: "desc" }
  });

  if (reservations.length > 0) {
    const phoneCandidates = Array.from(
      new Set(
        reservations
          .map((reservation) => reservation.patientPhone)
          .filter(Boolean)
          .flatMap((phone) => [phone, normalizePhone(phone)])
      )
    );
    if (phoneCandidates.length > 0) {
      const phoneReservations = await prisma.reservation.findMany({
        where: {
          patientPhone: { in: phoneCandidates }
        },
        orderBy: { slotStart: "desc" }
      });
      const merged = new Map<string, typeof reservations[0]>();
      reservations.forEach((reservation) => merged.set(reservation.id, reservation));
      phoneReservations.forEach((reservation) =>
        merged.set(reservation.id, reservation)
      );
      reservations = Array.from(merged.values()).sort(
        (a, b) => b.slotStart.getTime() - a.slotStart.getTime()
      );
    }
  }

  if (reservations.length === 0) {
    const todayStr = toJstDateString(new Date());
    const { start: todayStart } = getJstDayRange(todayStr);
    reservations = await prisma.reservation.findMany({
      where: {
        lineUserId: null,
        status: "booked",
        waitStatus: { notIn: ["arrived", "done"] },
        slotStart: { gte: todayStart }
      },
      orderBy: { slotStart: "asc" }
    });
  }

  const clinicId = reservations[0]?.clinicId;
  const clinic =
    (clinicId && (await prisma.clinic.findUnique({ where: { id: clinicId } }))) ||
    (await getOrCreateClinic());
  const rules = await prisma.slotRule.findMany({
    where: { clinicId: clinic.id }
  });

  const averageWaitMap = new Map<string, number>();

  const slotStarts = Array.from(
    new Set(reservations.map((reservation) => reservation.slotStart.toISOString()))
  );

  const queueMap = new Map<string, { position: number; total: number }>();
  for (const slotStartIso of slotStarts) {
    const slotStart = new Date(slotStartIso);
    const slotReservations = await prisma.reservation.findMany({
      where: {
        status: "booked",
        slotStart,
        waitStatus: { notIn: ["arrived", "done"] }
      },
      select: { id: true, queueOrder: true, queueNumber: true, slotStart: true }
    });

    const sorted = [...slotReservations].sort((a, b) => {
      if (a.queueOrder != null && b.queueOrder != null) {
        return a.queueOrder - b.queueOrder;
      }
      if (a.queueNumber != null && b.queueNumber != null) {
        return a.queueNumber - b.queueNumber;
      }
      return a.slotStart.getTime() - b.slotStart.getTime();
    });

    const total = sorted.length;
    sorted.forEach((reservation, index) => {
      queueMap.set(reservation.id, { position: index + 1, total });
    });
  }

  return NextResponse.json({
    reservations: reservations.map((reservation) => {
      const queueInfo = queueMap.get(reservation.id);
      return {
        id: reservation.id,
        patientName: reservation.patientName,
        slotStart: reservation.slotStart.toISOString(),
        status: reservation.status,
        waitStatus: reservation.waitStatus,
        queueNumber: reservation.queueNumber,
        queuePosition: queueInfo?.position ?? null,
        queueTotal: queueInfo?.total ?? null,
        estimatedWaitMinutes: (() => {
          if (!queueInfo?.position || queueInfo.position <= 1) return 0;
          const dateStr = toJstDateString(reservation.slotStart);
          const avg =
            averageWaitMap.get(dateStr) ??
            (() => {
              const value = calculateAverageWaitMinutes(rules, dateStr);
              averageWaitMap.set(dateStr, value);
              return value;
            })();
          return Math.max(queueInfo.position - 1, 0) * avg;
        })()
      };
    })
  });
}
