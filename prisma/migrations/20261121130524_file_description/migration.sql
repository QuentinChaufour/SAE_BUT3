/*
  Warnings:

  - Added the required column `idRecherche` to the `LienPj` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LienPj" ADD COLUMN     "idRecherche" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PieceJointe" ADD COLUMN     "taille" INTEGER,
ADD COLUMN     "type" VARCHAR;

-- AddForeignKey
ALTER TABLE "LienPj" ADD CONSTRAINT "LienPj_idRecherche_fkey" FOREIGN KEY ("idRecherche") REFERENCES "RechercheStage"("idRecherche") ON DELETE CASCADE ON UPDATE NO ACTION;
