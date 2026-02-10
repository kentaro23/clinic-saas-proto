import { z } from "zod";

export const reservationCreateSchema = z.object({
  patientName: z.string().min(1),
  patientPhone: z.string().min(6),
  purpose: z.enum(["first", "followup"]),
  cardNumber: z.string().optional(),
  slotStart: z.string().datetime(),
  clinicId: z.string().optional()
}).refine(
  (data) => (data.purpose === "followup" ? Boolean(data.cardNumber?.trim()) : true),
  {
    message: "診察券番号を入力してください。",
    path: ["cardNumber"]
  }
);

export const intakeSchema = z.object({
  reservationId: z.string().min(1),
  answers: z.object({
    symptoms: z.string().min(1),
    onset: z.string().min(1),
    history: z.string().optional(),
    medications: z.string().optional(),
    allergies: z.string().optional(),
    visitType: z.enum(["first", "followup"]),
    cardNumber: z.string().optional(),
    notes: z.string().optional()
  })
    .refine(
      (answers) => (answers.visitType === "followup" ? Boolean(answers.cardNumber?.trim()) : true),
      {
        message: "診察券番号を入力してください。",
        path: ["cardNumber"]
      }
    )
});

export const slotRuleSchema = z.object({
  weekday: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  intervalMinutes: z.number().min(5),
  capacity: z.number().min(1)
});

export const clinicSettingsSchema = z.object({
  bookingMode: z.enum(["time", "session"])
});
