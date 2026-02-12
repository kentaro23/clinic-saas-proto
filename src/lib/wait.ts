import type { SlotRule } from "@prisma/client";

import { getJstWeekday } from "@/lib/dates";

const DEFAULT_WAIT_MINUTES = 10;

export function calculateAverageWaitMinutes(
  rules: SlotRule[],
  dateStr: string
) {
  const weekday = getJstWeekday(dateStr);
  const dayRules = rules.filter((rule) => rule.weekday === weekday);
  if (dayRules.length === 0) {
    return DEFAULT_WAIT_MINUTES;
  }

  const samples = dayRules.map((rule) =>
    rule.intervalMinutes / Math.max(rule.capacity, 1)
  );
  const avg =
    samples.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1);
  return Math.max(Math.round(avg), 1);
}
