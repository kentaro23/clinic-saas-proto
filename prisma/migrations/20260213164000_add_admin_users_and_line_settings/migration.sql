ALTER TABLE "Clinic" ADD COLUMN "lineChannelAccessToken" TEXT;
ALTER TABLE "Clinic" ADD COLUMN "lineChannelSecret" TEXT;
ALTER TABLE "Clinic" ADD COLUMN "liffBookingId" TEXT;
ALTER TABLE "Clinic" ADD COLUMN "liffReservationsId" TEXT;

CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'clinic',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
