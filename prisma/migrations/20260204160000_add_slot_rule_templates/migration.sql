CREATE TABLE "SlotRuleTemplate" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rules" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SlotRuleTemplate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SlotRuleTemplate"
ADD CONSTRAINT "SlotRuleTemplate_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
