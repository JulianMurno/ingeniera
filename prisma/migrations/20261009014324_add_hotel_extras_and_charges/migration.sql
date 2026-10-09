-- CreateTable
CREATE TABLE "HotelExtra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "precio" INTEGER NOT NULL,
    "unidad" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "descripcion" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ExtraCharge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reservationId" INTEGER NOT NULL,
    "extraId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" INTEGER NOT NULL,
    "importe" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "nota" TEXT,
    "registradoPorId" INTEGER NOT NULL,
    "anuladoPorId" INTEGER,
    "anuladoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtraCharge_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExtraCharge_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "HotelExtra" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExtraCharge_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExtraCharge_anuladoPorId_fkey" FOREIGN KEY ("anuladoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "HotelExtra_codigo_key" ON "HotelExtra"("codigo");

-- CreateIndex
CREATE INDEX "ExtraCharge_reservationId_estado_idx" ON "ExtraCharge"("reservationId", "estado");

-- CreateIndex
CREATE INDEX "ExtraCharge_extraId_creadoEn_idx" ON "ExtraCharge"("extraId", "creadoEn");

-- CreateIndex
CREATE INDEX "ExtraCharge_estado_idx" ON "ExtraCharge"("estado");
