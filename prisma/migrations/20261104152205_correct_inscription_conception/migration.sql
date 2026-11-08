/*
  Warnings:

  - The primary key for the `Inscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `annee` on the `RechercheStage` table. All the data in the column will be lost.
  - You are about to drop the column `numEtu` on the `RechercheStage` table. All the data in the column will be lost.
  - You are about to drop the column `annee` on the `Stage` table. All the data in the column will be lost.
  - You are about to drop the column `numEtu` on the `Stage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[numEtu,idFormation,annee]` on the table `Inscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idInscription` to the `RechercheStage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idInscription` to the `Stage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DemarcheEvenement" DROP CONSTRAINT "DemarcheEvenement_idRecherche_fkey";

-- DropForeignKey
ALTER TABLE "DemarcheRechercheContact" DROP CONSTRAINT "DemarcheRechercheContact_idDemarche_fkey";

-- DropForeignKey
ALTER TABLE "DepartementTagRecherche" DROP CONSTRAINT "DepartementTagRecherche_idRecherche_fkey";

-- DropForeignKey
ALTER TABLE "LienPj" DROP CONSTRAINT "LienPj_idDemarche_fkey";

-- DropForeignKey
ALTER TABLE "RechercheStage" DROP CONSTRAINT "RechercheStage_annee_fkey";

-- DropForeignKey
ALTER TABLE "RechercheStage" DROP CONSTRAINT "RechercheStage_numEtu_fkey";

-- DropForeignKey
ALTER TABLE "Stage" DROP CONSTRAINT "Stage_annee_fkey";

-- DropForeignKey
ALTER TABLE "Stage" DROP CONSTRAINT "Stage_numEtu_fkey";

-- AlterTable
ALTER TABLE "Inscription" DROP CONSTRAINT "Inscription_pkey",
ADD COLUMN     "idInscription" SERIAL NOT NULL,
ADD CONSTRAINT "Inscription_pkey" PRIMARY KEY ("idInscription");

-- AlterTable
ALTER TABLE "RechercheStage" DROP COLUMN "annee",
DROP COLUMN "numEtu",
ADD COLUMN     "idInscription" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Stage" DROP COLUMN "annee",
DROP COLUMN "numEtu",
ADD COLUMN     "idInscription" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Inscription_numEtu_idFormation_annee_key" ON "Inscription"("numEtu", "idFormation", "annee");

-- AddForeignKey
ALTER TABLE "DemarcheEvenement" ADD CONSTRAINT "DemarcheEvenement_idRecherche_fkey" FOREIGN KEY ("idRecherche") REFERENCES "RechercheStage"("idRecherche") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DemarcheRechercheContact" ADD CONSTRAINT "DemarcheRechercheContact_idDemarche_fkey" FOREIGN KEY ("idDemarche") REFERENCES "DemarcheEvenement"("idDemarche") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DepartementTagRecherche" ADD CONSTRAINT "DepartementTagRecherche_idRecherche_fkey" FOREIGN KEY ("idRecherche") REFERENCES "RechercheStage"("idRecherche") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LienPj" ADD CONSTRAINT "LienPj_idDemarche_fkey" FOREIGN KEY ("idDemarche") REFERENCES "DemarcheEvenement"("idDemarche") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RechercheStage" ADD CONSTRAINT "RechercheStage_idInscription_fkey" FOREIGN KEY ("idInscription") REFERENCES "Inscription"("idInscription") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_idInscription_fkey" FOREIGN KEY ("idInscription") REFERENCES "Inscription"("idInscription") ON DELETE NO ACTION ON UPDATE NO ACTION;
