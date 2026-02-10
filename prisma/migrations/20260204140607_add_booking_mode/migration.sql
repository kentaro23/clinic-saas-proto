-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Clinic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bookingMode" TEXT NOT NULL DEFAULT 'time',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Clinic" ("createdAt", "id", "name") SELECT "createdAt", "id", "name" FROM "Clinic";
DROP TABLE "Clinic";
ALTER TABLE "new_Clinic" RENAME TO "Clinic";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
