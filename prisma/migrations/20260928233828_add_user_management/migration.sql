-- CreateTable
CREATE TABLE "TokenInvalidado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jti" TEXT NOT NULL,
    "expiraEn" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "id", "password", "rol", "username") SELECT "createdAt", "id", "password", "rol", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TokenInvalidado_jti_key" ON "TokenInvalidado"("jti");

-- CreateIndex
CREATE INDEX "TokenInvalidado_expiraEn_idx" ON "TokenInvalidado"("expiraEn");
