/*
  Warnings:

  - Made the column `password` on table `Auth` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Auth" ALTER COLUMN "password" SET NOT NULL;
