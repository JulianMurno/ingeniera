-- AlterTable
ALTER TABLE "Room" ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'DISPONIBLE';

-- AlterTable
ALTER TABLE "Room" ADD COLUMN "capacidad" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN "descripcion" TEXT;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN "comodidades" TEXT;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN "fotos" TEXT;
