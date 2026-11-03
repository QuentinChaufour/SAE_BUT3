/*
  Warnings:

  - A unique constraint covering the columns `[numPersonnel]` on the table `Auth` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numEnseignant]` on the table `Auth` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numEtu]` on the table `Auth` will be added. If there are existing duplicate values, this will fail.
  - Made the column `password` on table `Auth` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Auth" ALTER COLUMN "password" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Auth_numPersonnel_key" ON "Auth"("numPersonnel");

-- CreateIndex
CREATE UNIQUE INDEX "Auth_numEnseignant_key" ON "Auth"("numEnseignant");

-- CreateIndex
CREATE UNIQUE INDEX "Auth_numEtu_key" ON "Auth"("numEtu");

-- Enforce exactly one authenticated user type per account.
ALTER TABLE "Auth"
ADD CONSTRAINT "Auth_exactly_one_user_check"
CHECK (
    (CASE WHEN "numPersonnel" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "numEnseignant" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "numEtu" IS NOT NULL THEN 1 ELSE 0 END) = 1
);