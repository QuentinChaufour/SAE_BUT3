/*
  Warnings:

  - Made the column `role` on table `Personnel` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Personnel" ALTER COLUMN "role" SET NOT NULL;
