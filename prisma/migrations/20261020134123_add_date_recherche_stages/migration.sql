/*
  Warnings:

  - Made the column `status` on table `DemarcheEvenement` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `dateDerniereModification` to the `RechercheStage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `RechercheStage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DemarcheEvenement" ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "RechercheStage" ADD COLUMN     "dateCreation" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateDerniereModification" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "Recherche_Stage_Status" NOT NULL;
