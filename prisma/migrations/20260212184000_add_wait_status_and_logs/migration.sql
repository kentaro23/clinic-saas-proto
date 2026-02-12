ALTER TABLE "Reservation" ADD COLUMN "waitStatus" TEXT NOT NULL DEFAULT 'waiting';

CREATE TABLE "ReservationLog" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReservationLog" ADD CONSTRAINT "ReservationLog_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
