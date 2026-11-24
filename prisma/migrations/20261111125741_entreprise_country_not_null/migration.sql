/*
  Warnings:

  - Made the column `pays` on table `Entreprise` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Entreprise" ALTER COLUMN "pays" SET NOT NULL;
