import type { Reservation, SlotRule } from "@prisma/client";

import { endOfDay, startOfDay } from "@/lib/dates";

export type SlotMode = "time" | "session";

export type SlotCandidate = {
  slotStart: Date;
  remaining: number;
  capacity: number;
  kind: SlotMode;
  label?: string;
};

type Rule = Pick<
  SlotRule,
  "weekday" | "startTime" | "endTime" | "intervalMinutes" | "capacity"
>;

type CalculateArgs = {
  date: Date;
  rules: Rule[];
  reservations: Reservation[];
  mode: SlotMode;
};

const buildTimeSlots = ({
  date,
  rules,
  reservations
}: Omit<CalculateArgs, "mode">): SlotCandidate[] => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const weekday = date.getDay();
  const results: SlotCandidate[] = [];
  const bookings = reservations.filter(
    (reservation) =>
      reservation.status === "booked" &&
      reservation.slotStart >= dayStart &&
      reservation.slotStart <= dayEnd
  );

  rules
    .filter((rule) => rule.weekday === weekday)
    .forEach((rule) => {
      const [startHour, startMinute] = rule.startTime.split(":").map(Number);
      const [endHour, endMinute] = rule.endTime.split(":").map(Number);
      const start = new Date(dayStart);
      start.setHours(startHour, startMinute, 0, 0);
      const end = new Date(dayStart);
      end.setHours(endHour, endMinute, 0, 0);

      for (
        let cursor = new Date(start);
        cursor < end;
        cursor = new Date(cursor.getTime() + rule.intervalMinutes * 60000)
      ) {
        const count = bookings.filter(
          (reservation) =>
            reservation.slotStart.getTime() === cursor.getTime()
        ).length;
        const remaining = Math.max(rule.capacity - count, 0);
        results.push({
          slotStart: new Date(cursor),
          remaining,
          capacity: rule.capacity,
          kind: "time"
        });
      }
    });

  return results.sort((a, b) => a.slotStart.getTime() - b.slotStart.getTime());
};

const buildSessionSlots = ({
  date,
  rules,
  reservations
}: Omit<CalculateArgs, "mode">): SlotCandidate[] => {
  const timeSlots = buildTimeSlots({ date, rules, reservations }).filter(
    (slot) => slot.capacity > 0
  );
  const morningSlots = timeSlots.filter(
    (slot) => slot.slotStart.getHours() < 12
  );
  const afternoonSlots = timeSlots.filter(
    (slot) => slot.slotStart.getHours() >= 12
  );
  const results: SlotCandidate[] = [];

  if (morningSlots.length > 0) {
    results.push({
      slotStart: morningSlots[0].slotStart,
      capacity: morningSlots.reduce((sum, slot) => sum + slot.capacity, 0),
      remaining: morningSlots.reduce((sum, slot) => sum + slot.remaining, 0),
      kind: "session",
      label: "午前の部"
    });
  }

  if (afternoonSlots.length > 0) {
    results.push({
      slotStart: afternoonSlots[0].slotStart,
      capacity: afternoonSlots.reduce((sum, slot) => sum + slot.capacity, 0),
      remaining: afternoonSlots.reduce((sum, slot) => sum + slot.remaining, 0),
      kind: "session",
      label: "午後の部"
    });
  }

  return results;
};

export function calculateSlots({
  date,
  rules,
  reservations,
  mode
}: CalculateArgs): SlotCandidate[] {
  if (mode === "session") {
    return buildSessionSlots({ date, rules, reservations });
  }
  return buildTimeSlots({ date, rules, reservations });
}
