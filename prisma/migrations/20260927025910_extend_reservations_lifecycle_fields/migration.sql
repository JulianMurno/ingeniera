-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guestId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "checkIn" DATETIME NOT NULL,
    "checkOut" DATETIME NOT NULL,
    "noches" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CONFIRMADA',
    "adultos" INTEGER NOT NULL DEFAULT 1,
    "menores" INTEGER NOT NULL DEFAULT 0,
    "codigo" TEXT,
    "notas" TEXT,
    "motivoCancelacion" TEXT,
    "multaCancelacion" INTEGER NOT NULL DEFAULT 0,
    "earlyCheckIn" BOOLEAN NOT NULL DEFAULT false,
    "lateCheckOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("checkIn", "checkOut", "createdAt", "earlyCheckIn", "estado", "guestId", "id", "lateCheckOut", "noches", "roomId", "total") SELECT "checkIn", "checkOut", "createdAt", "earlyCheckIn", "estado", "guestId", "id", "lateCheckOut", "noches", "roomId", "total" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE INDEX "Reservation_roomId_checkIn_checkOut_idx" ON "Reservation"("roomId", "checkIn", "checkOut");
CREATE INDEX "Reservation_guestId_idx" ON "Reservation"("guestId");
CREATE INDEX "Reservation_checkIn_idx" ON "Reservation"("checkIn");
CREATE INDEX "Reservation_checkOut_idx" ON "Reservation"("checkOut");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
