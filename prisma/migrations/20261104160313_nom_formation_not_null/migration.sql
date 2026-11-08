/*
  Warnings:

  - Made the column `nomFormation` on table `Formation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Formation" ALTER COLUMN "nomFormation" SET NOT NULL;
