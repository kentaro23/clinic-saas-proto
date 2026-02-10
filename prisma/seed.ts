import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function makeDateWithTime(date: Date, time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  await prisma.messageLog.deleteMany();
  await prisma.intakeAnswer.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.slotRule.deleteMany();
  await prisma.clinic.deleteMany();

  const clinic = await prisma.clinic.create({
    data: { name: "みらいクリニック" }
  });

  const slotRules = await prisma.slotRule.createMany({
    data: [
      {
        clinicId: clinic.id,
        weekday: 1,
        startTime: "09:00",
        endTime: "12:00",
        intervalMinutes: 30,
        capacity: 2
      },
      {
        clinicId: clinic.id,
        weekday: 2,
        startTime: "13:00",
        endTime: "17:00",
        intervalMinutes: 30,
        capacity: 2
      },
      {
        clinicId: clinic.id,
        weekday: 3,
        startTime: "09:00",
        endTime: "12:00",
        intervalMinutes: 20,
        capacity: 1
      },
      {
        clinicId: clinic.id,
        weekday: 4,
        startTime: "14:00",
        endTime: "18:00",
        intervalMinutes: 30,
        capacity: 1
      },
      {
        clinicId: clinic.id,
        weekday: 5,
        startTime: "09:00",
        endTime: "13:00",
        intervalMinutes: 30,
        capacity: 2
      },
      {
        clinicId: clinic.id,
        weekday: 6,
        startTime: "10:00",
        endTime: "14:00",
        intervalMinutes: 30,
        capacity: 1
      },
      {
        clinicId: clinic.id,
        weekday: 0,
        startTime: "10:00",
        endTime: "13:00",
        intervalMinutes: 30,
        capacity: 1
      }
    ]
  });

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const reservation1 = await prisma.reservation.create({
    data: {
      clinicId: clinic.id,
      patientName: "山田 太郎",
      patientPhone: "090-1111-2222",
      purpose: "初診",
      slotStart: makeDateWithTime(today, "09:00")
    }
  });

  const reservation2 = await prisma.reservation.create({
    data: {
      clinicId: clinic.id,
      patientName: "鈴木 花子",
      patientPhone: "090-3333-4444",
      purpose: "再診",
      slotStart: makeDateWithTime(today, "10:00")
    }
  });

  const reservation3 = await prisma.reservation.create({
    data: {
      clinicId: clinic.id,
      patientName: "田中 次郎",
      patientPhone: "090-5555-6666",
      purpose: "美容相談",
      slotStart: makeDateWithTime(tomorrow, "14:00")
    }
  });

  await prisma.intakeAnswer.create({
    data: {
      reservationId: reservation1.id,
      answers: JSON.stringify({
        symptoms: "喉の痛みと微熱",
        onset: "2日前",
        history: "特になし",
        medications: "市販の解熱剤",
        allergies: "なし",
        chiefComplaint: "喉の痛み",
        notes: "来院前にLINEで相談済み"
      })
    }
  });

  await prisma.messageLog.createMany({
    data: [
      {
        reservationId: reservation1.id,
        type: "confirm",
        channel: "line_mock",
        payload: JSON.stringify({
          message: "予約確認メッセージ送信",
          reservationId: reservation1.id
        })
      },
      {
        reservationId: reservation2.id,
        type: "reminder",
        channel: "line_mock",
        payload: JSON.stringify({
          message: "前日リマインド送信",
          reservationId: reservation2.id
        })
      },
      {
        reservationId: reservation3.id,
        type: "reminder",
        channel: "line_mock",
        payload: JSON.stringify({
          message: "当日リマインド送信",
          reservationId: reservation3.id
        })
      }
    ]
  });

  console.log("Seeded demo data.");
  console.log("Slot rules created:", slotRules.count);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
