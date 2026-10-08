-- CreateTable
CREATE TABLE "HousekeepingTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "asignadoAId" INTEGER,
    "fechaProgramada" DATETIME NOT NULL,
    "observaciones" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "HousekeepingTask_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HousekeepingTask_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceTicket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "resolucion" TEXT,
    "reportadoPorId" INTEGER NOT NULL,
    "asignadoAId" INTEGER,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "resueltoEn" DATETIME,
    CONSTRAINT "MaintenanceTicket_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceTicket_reportadoPorId_fkey" FOREIGN KEY ("reportadoPorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceTicket_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "HousekeepingTask_roomId_estado_idx" ON "HousekeepingTask"("roomId", "estado");

-- CreateIndex
CREATE INDEX "HousekeepingTask_estado_fechaProgramada_idx" ON "HousekeepingTask"("estado", "fechaProgramada");

-- CreateIndex
CREATE INDEX "HousekeepingTask_asignadoAId_estado_idx" ON "HousekeepingTask"("asignadoAId", "estado");

-- CreateIndex
CREATE INDEX "MaintenanceTicket_roomId_estado_idx" ON "MaintenanceTicket"("roomId", "estado");

-- CreateIndex
CREATE INDEX "MaintenanceTicket_estado_prioridad_idx" ON "MaintenanceTicket"("estado", "prioridad");
