/*
  Warnings:

  - A unique constraint covering the columns `[nom]` on the table `Departement` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Departement_nom_key" ON "Departement"("nom");
