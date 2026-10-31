/*
  Warnings:

  - You are about to drop the column `email` on the `Entreprise` table. All the data in the column will be lost.
  - You are about to drop the column `telephone` on the `Entreprise` table. All the data in the column will be lost.
  - The `type` column on the `Stage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `adresse` on table `Entreprise` required. This step will fail if there are existing NULL values in that column.
  - Made the column `codePostal` on table `Entreprise` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ville` on table `Entreprise` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Entreprise" DROP COLUMN "email",
DROP COLUMN "telephone",
ADD COLUMN     "nomEtab" VARCHAR,
ADD COLUMN     "pays" VARCHAR,
ALTER COLUMN "adresse" SET NOT NULL,
ALTER COLUMN "codePostal" SET NOT NULL,
ALTER COLUMN "ville" SET NOT NULL;

-- AlterTable
ALTER TABLE "Stage" DROP COLUMN "type",
ADD COLUMN     "type" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "Stage_Type";
