-- CreateTable
CREATE TABLE "Season" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomType" TEXT NOT NULL,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME NOT NULL,
    "tarifa" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WeekdayRate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomType" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "tarifa" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
    "earlyCheckIn" BOOLEAN NOT NULL DEFAULT false,
    "lateCheckOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("checkIn", "checkOut", "createdAt", "estado", "guestId", "id", "noches", "roomId", "total") SELECT "checkIn", "checkOut", "createdAt", "estado", "guestId", "id", "noches", "roomId", "total" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE INDEX "Reservation_roomId_checkIn_checkOut_idx" ON "Reservation"("roomId", "checkIn", "checkOut");
CREATE INDEX "Reservation_guestId_idx" ON "Reservation"("guestId");
CREATE INDEX "Reservation_checkIn_idx" ON "Reservation"("checkIn");
CREATE INDEX "Reservation_checkOut_idx" ON "Reservation"("checkOut");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Season_roomType_fechaInicio_fechaFin_idx" ON "Season"("roomType", "fechaInicio", "fechaFin");

-- CreateIndex
CREATE UNIQUE INDEX "WeekdayRate_roomType_diaSemana_key" ON "WeekdayRate"("roomType", "diaSemana");
