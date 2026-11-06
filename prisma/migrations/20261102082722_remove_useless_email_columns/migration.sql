/*
  Warnings:

  - You are about to drop the column `email` on the `Enseignant` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Etudiant` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Personnel` table. All the data in the column will be lost.
  - Made the column `nom` on table `Enseignant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prenom` on table `Enseignant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nom` on table `Etudiant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prenom` on table `Etudiant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nom` on table `Personnel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prenom` on table `Personnel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nom` on table `PieceJointe` required. This step will fail if there are existing NULL values in that column.
  - Made the column `chemin` on table `PieceJointe` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Enseignant" DROP COLUMN "email",
ALTER COLUMN "nom" SET NOT NULL,
ALTER COLUMN "prenom" SET NOT NULL;

-- AlterTable
ALTER TABLE "Etudiant" DROP COLUMN "email",
ALTER COLUMN "nom" SET NOT NULL,
ALTER COLUMN "prenom" SET NOT NULL;

-- AlterTable
ALTER TABLE "Personnel" DROP COLUMN "email",
ALTER COLUMN "nom" SET NOT NULL,
ALTER COLUMN "prenom" SET NOT NULL;

-- AlterTable
ALTER TABLE "PieceJointe" ALTER COLUMN "nom" SET NOT NULL,
ALTER COLUMN "chemin" SET NOT NULL;
