/*
  Warnings:

  - Made the column `nom` on table `PieceJointe` required. This step will fail if there are existing NULL values in that column.
  - Made the column `chemin` on table `PieceJointe` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "Demarche_Source" ADD VALUE 'Autre';

-- AlterTable
ALTER TABLE "DemarcheContact" ADD COLUMN     "idRecherche" INTEGER;

-- AlterTable
ALTER TABLE "DemarcheEvenement" ADD COLUMN     "titre" TEXT;

-- AlterTable
ALTER TABLE "PieceJointe" ALTER COLUMN "nom" SET NOT NULL,
ALTER COLUMN "chemin" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "DemarcheContact" ADD CONSTRAINT "DemarcheContact_idRecherche_fkey" FOREIGN KEY ("idRecherche") REFERENCES "RechercheStage"("idRecherche") ON DELETE NO ACTION ON UPDATE NO ACTION;
