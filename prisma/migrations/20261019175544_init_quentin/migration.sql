-- CreateEnum
CREATE TYPE "Demarche_Source" AS ENUM ('Email', 'Telephone', 'Presentiel', 'Visio');

-- CreateEnum
CREATE TYPE "Personnel_Role" AS ENUM ('admin', 'secretariat');

-- CreateEnum
CREATE TYPE "Proposition_Tuteur_Univ_Status" AS ENUM ('EnAttente', 'Refuse', 'Accepte');

-- CreateEnum
CREATE TYPE "Recherche_Stage_Status" AS ENUM ('Accepte', 'Refuse', 'Abandon', 'Entretien', 'AttenteReponse', 'AttenteEnvoi');

-- CreateEnum
CREATE TYPE "Stage_Type" AS ENUM ('stage', 'alternance');

-- CreateTable
CREATE TABLE "AnneeEnseignant" (
    "numEnseignant" VARCHAR NOT NULL,
    "idDepartement" INTEGER NOT NULL,
    "annee" VARCHAR NOT NULL,

    CONSTRAINT "AnneeEnseignant_pkey" PRIMARY KEY ("numEnseignant","idDepartement","annee")
);

-- CreateTable
CREATE TABLE "AnneeUniversitaire" (
    "annee" VARCHAR NOT NULL,

    CONSTRAINT "AnneeUniversitaire_pkey" PRIMARY KEY ("annee")
);

-- CreateTable
CREATE TABLE "Appartenir" (
    "idAppartenance" SERIAL NOT NULL,
    "numPersonnel" VARCHAR NOT NULL,
    "idDepartement" INTEGER NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE,

    CONSTRAINT "Appartenir_pkey" PRIMARY KEY ("idAppartenance")
);

-- CreateTable
CREATE TABLE "Auth" (
    "login" VARCHAR NOT NULL,
    "password" VARCHAR,
    "numPersonnel" VARCHAR,
    "numEnseignant" VARCHAR,
    "numEtu" VARCHAR,

    CONSTRAINT "Auth_pkey" PRIMARY KEY ("login")
);

-- CreateTable
CREATE TABLE "DemarcheContact" (
    "idContact" SERIAL NOT NULL,
    "nom" VARCHAR NOT NULL,
    "prenom" VARCHAR,
    "fonction" VARCHAR,
    "email" VARCHAR,
    "telephone" VARCHAR,

    CONSTRAINT "DemarcheContact_pkey" PRIMARY KEY ("idContact")
);

-- CreateTable
CREATE TABLE "DemarcheEvenement" (
    "idDemarche" SERIAL NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "status" "Recherche_Stage_Status",
    "source" "Demarche_Source" NOT NULL,
    "idRecherche" INTEGER NOT NULL,

    CONSTRAINT "DemarcheEvenement_pkey" PRIMARY KEY ("idDemarche")
);

-- CreateTable
CREATE TABLE "DemarcheRechercheContact" (
    "idDemarche" INTEGER NOT NULL,
    "idContact" INTEGER NOT NULL,

    CONSTRAINT "DemarcheRechercheContact_pkey" PRIMARY KEY ("idDemarche","idContact")
);

-- CreateTable
CREATE TABLE "Departement" (
    "idDepartement" SERIAL NOT NULL,
    "nom" VARCHAR NOT NULL,
    "anneeActuelle" VARCHAR NOT NULL,

    CONSTRAINT "Departement_pkey" PRIMARY KEY ("idDepartement")
);

-- CreateTable
CREATE TABLE "DepartementTag" (
    "idTag" SERIAL NOT NULL,
    "nomTag" VARCHAR NOT NULL,
    "idDepartement" INTEGER NOT NULL,

    CONSTRAINT "DepartementTag_pkey" PRIMARY KEY ("idTag")
);

-- CreateTable
CREATE TABLE "DepartementTagRecherche" (
    "idRecherche" INTEGER NOT NULL,
    "idTag" INTEGER NOT NULL,

    CONSTRAINT "DepartementTagRecherche_pkey" PRIMARY KEY ("idRecherche","idTag")
);

-- CreateTable
CREATE TABLE "Enseignant" (
    "numEnseignant" VARCHAR NOT NULL,
    "nom" VARCHAR,
    "prenom" VARCHAR,
    "email" VARCHAR,

    CONSTRAINT "Enseignant_pkey" PRIMARY KEY ("numEnseignant")
);

-- CreateTable
CREATE TABLE "EnseignantEtuFavori" (
    "numEnseignant" VARCHAR NOT NULL,
    "numEtu" VARCHAR NOT NULL,
    "annee" VARCHAR NOT NULL,

    CONSTRAINT "EnseignantEtuFavori_pkey" PRIMARY KEY ("numEnseignant","numEtu","annee")
);

-- CreateTable
CREATE TABLE "EnseignantSoutenance" (
    "idSoutenance" INTEGER NOT NULL,
    "numEnseignant" VARCHAR NOT NULL,

    CONSTRAINT "EnseignantSoutenance_pkey" PRIMARY KEY ("idSoutenance","numEnseignant")
);

-- CreateTable
CREATE TABLE "Entreprise" (
    "idEntreprise" SERIAL NOT NULL,
    "nom" VARCHAR NOT NULL,
    "adresse" VARCHAR,
    "codePostal" VARCHAR,
    "ville" VARCHAR,
    "email" VARCHAR,
    "telephone" VARCHAR,
    "siret" VARCHAR,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("idEntreprise")
);

-- CreateTable
CREATE TABLE "Etudiant" (
    "numEtu" VARCHAR NOT NULL,
    "nom" VARCHAR,
    "prenom" VARCHAR,
    "email" VARCHAR,

    CONSTRAINT "Etudiant_pkey" PRIMARY KEY ("numEtu")
);

-- CreateTable
CREATE TABLE "Formation" (
    "idFormation" SERIAL NOT NULL,
    "nomFormation" VARCHAR,
    "alternance" BOOLEAN NOT NULL,
    "idDepartement" INTEGER NOT NULL,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("idFormation")
);

-- CreateTable
CREATE TABLE "Inscription" (
    "numEtu" VARCHAR NOT NULL,
    "idFormation" INTEGER NOT NULL,
    "annee" VARCHAR NOT NULL,
    "dateInscription" DATE NOT NULL,
    "dateDepart" DATE,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("numEtu","idFormation","annee")
);

-- CreateTable
CREATE TABLE "LienPj" (
    "idPieceJointe" INTEGER NOT NULL,
    "idDemarche" INTEGER NOT NULL,

    CONSTRAINT "LienPj_pkey" PRIMARY KEY ("idPieceJointe","idDemarche")
);

-- CreateTable
CREATE TABLE "Personnel" (
    "numPersonnel" VARCHAR NOT NULL,
    "nom" VARCHAR,
    "prenom" VARCHAR,
    "email" VARCHAR,
    "role" "Personnel_Role",

    CONSTRAINT "Personnel_pkey" PRIMARY KEY ("numPersonnel")
);

-- CreateTable
CREATE TABLE "PieceJointe" (
    "idPieceJointe" SERIAL NOT NULL,
    "nom" VARCHAR,
    "chemin" VARCHAR,

    CONSTRAINT "PieceJointe_pkey" PRIMARY KEY ("idPieceJointe")
);

-- CreateTable
CREATE TABLE "PropositionTuteurUniv" (
    "idStage" INTEGER NOT NULL,
    "numEnseignant" VARCHAR NOT NULL,
    "status" "Proposition_Tuteur_Univ_Status",

    CONSTRAINT "PropositionTuteurUniv_pkey" PRIMARY KEY ("idStage","numEnseignant")
);

-- CreateTable
CREATE TABLE "QuotaEnseignant" (
    "numEnseignant" VARCHAR NOT NULL,
    "idDepartement" INTEGER NOT NULL,
    "annee" VARCHAR NOT NULL,
    "idFormation" INTEGER NOT NULL,
    "quotaTuteurs" INTEGER NOT NULL,
    "quotaCandides" INTEGER NOT NULL,

    CONSTRAINT "QuotaEnseignant_pkey" PRIMARY KEY ("numEnseignant","idDepartement","annee","idFormation")
);

-- CreateTable
CREATE TABLE "RechercheStage" (
    "idRecherche" INTEGER NOT NULL,
    "titre" VARCHAR NOT NULL,
    "description" TEXT,
    "alternance" BOOLEAN NOT NULL,
    "idEntreprise" INTEGER NOT NULL,
    "numEtu" VARCHAR NOT NULL,
    "annee" VARCHAR NOT NULL,

    CONSTRAINT "RechercheStage_pkey" PRIMARY KEY ("idRecherche")
);

-- CreateTable
CREATE TABLE "Salle" (
    "idSalle" SERIAL NOT NULL,
    "nomSalle" VARCHAR NOT NULL,
    "batiment" VARCHAR,

    CONSTRAINT "Salle_pkey" PRIMARY KEY ("idSalle")
);

-- CreateTable
CREATE TABLE "Soutenance" (
    "idSoutenance" SERIAL NOT NULL,
    "dateDebut" DATE,
    "dateFin" DATE,
    "idSalle" INTEGER NOT NULL,
    "annee" VARCHAR NOT NULL,

    CONSTRAINT "Soutenance_pkey" PRIMARY KEY ("idSoutenance")
);

-- CreateTable
CREATE TABLE "SoutenanceStage" (
    "idSoutenance" INTEGER NOT NULL,
    "idStage" INTEGER NOT NULL,

    CONSTRAINT "SoutenanceStage_pkey" PRIMARY KEY ("idSoutenance","idStage")
);

-- CreateTable
CREATE TABLE "Stage" (
    "idStage" SERIAL NOT NULL,
    "dateDebut" DATE,
    "dateFin" DATE,
    "titre" VARCHAR,
    "description" TEXT,
    "type" "Stage_Type",
    "confidentielle" BOOLEAN NOT NULL DEFAULT false,
    "numEtu" VARCHAR NOT NULL,
    "idTuteurEntreprise" INTEGER NOT NULL,
    "annee" VARCHAR NOT NULL,
    "numEnseignant" VARCHAR,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("idStage")
);

-- CreateTable
CREATE TABLE "TuteurEntreprise" (
    "idTuteurEntreprise" SERIAL NOT NULL,
    "nom" VARCHAR,
    "prenom" VARCHAR,
    "telephone" VARCHAR,
    "email" VARCHAR,
    "idEntreprise" INTEGER NOT NULL,

    CONSTRAINT "TuteurEntreprise_pkey" PRIMARY KEY ("idTuteurEntreprise")
);

-- CreateIndex
CREATE UNIQUE INDEX "DEPARTEMENT_TAG_nomTag_idDepartement_idx" ON "DepartementTag"("nomTag", "idDepartement");

-- AddForeignKey
ALTER TABLE "AnneeEnseignant" ADD CONSTRAINT "AnneeEnseignant_annee_fkey" FOREIGN KEY ("annee") REFERENCES "AnneeUniversitaire"("annee") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AnneeEnseignant" ADD CONSTRAINT "AnneeEnseignant_idDepartement_fkey" FOREIGN KEY ("idDepartement") REFERENCES "Departement"("idDepartement") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AnneeEnseignant" ADD CONSTRAINT "AnneeEnseignant_numEnseignant_fkey" FOREIGN KEY ("numEnseignant") REFERENCES "Enseignant"("numEnseignant") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Appartenir" ADD CONSTRAINT "Appartenir_idDepartement_fkey" FOREIGN KEY ("idDepartement") REFERENCES "Departement"("idDepartement") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Appartenir" ADD CONSTRAINT "Appartenir_numPersonnel_fkey" FOREIGN KEY ("numPersonnel") REFERENCES "Personnel"("numPersonnel") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Auth" ADD CONSTRAINT "Auth_numEnseignant_fkey" FOREIGN KEY ("numEnseignant") REFERENCES "Enseignant"("numEnseignant") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Auth" ADD CONSTRAINT "Auth_numEtu_fkey" FOREIGN KEY ("numEtu") REFERENCES "Etudiant"("numEtu") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Auth" ADD CONSTRAINT "Auth_numPersonnel_fkey" FOREIGN KEY ("numPersonnel") REFERENCES "Personnel"("numPersonnel") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DemarcheEvenement" ADD CONSTRAINT "DemarcheEvenement_idRecherche_fkey" FOREIGN KEY ("idRecherche") REFERENCES "RechercheStage"("idRecherche") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DemarcheRechercheContact" ADD CONSTRAINT "DemarcheRechercheContact_idContact_fkey" FOREIGN KEY ("idContact") REFERENCES "DemarcheContact"("idContact") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DemarcheRechercheContact" ADD CONSTRAINT "DemarcheRechercheContact_idDemarche_fkey" FOREIGN KEY ("idDemarche") REFERENCES "DemarcheEvenement"("idDemarche") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Departement" ADD CONSTRAINT "Departement_anneeActuelle_fkey" FOREIGN KEY ("anneeActuelle") REFERENCES "AnneeUniversitaire"("annee") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DepartementTag" ADD CONSTRAINT "DepartementTag_idDepartement_fkey" FOREIGN KEY ("idDepartement") REFERENCES "Departement"("idDepartement") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DepartementTagRecherche" ADD CONSTRAINT "DepartementTagRecherche_idRecherche_fkey" FOREIGN KEY ("idRecherche") REFERENCES "RechercheStage"("idRecherche") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DepartementTagRecherche" ADD CONSTRAINT "DepartementTagRecherche_idTag_fkey" FOREIGN KEY ("idTag") REFERENCES "DepartementTag"("idTag") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EnseignantEtuFavori" ADD CONSTRAINT "EnseignantEtuFavori_annee_fkey" FOREIGN KEY ("annee") REFERENCES "AnneeUniversitaire"("annee") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EnseignantEtuFavori" ADD CONSTRAINT "EnseignantEtuFavori_numEnseignant_fkey" FOREIGN KEY ("numEnseignant") REFERENCES "Enseignant"("numEnseignant") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EnseignantEtuFavori" ADD CONSTRAINT "EnseignantEtuFavori_numEtu_fkey" FOREIGN KEY ("numEtu") REFERENCES "Etudiant"("numEtu") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EnseignantSoutenance" ADD CONSTRAINT "EnseignantSoutenance_idSoutenance_fkey" FOREIGN KEY ("idSoutenance") REFERENCES "Soutenance"("idSoutenance") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EnseignantSoutenance" ADD CONSTRAINT "EnseignantSoutenance_numEnseignant_fkey" FOREIGN KEY ("numEnseignant") REFERENCES "Enseignant"("numEnseignant") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_idDepartement_fkey" FOREIGN KEY ("idDepartement") REFERENCES "Departement"("idDepartement") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_annee_fkey" FOREIGN KEY ("annee") REFERENCES "AnneeUniversitaire"("annee") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_idFormation_fkey" FOREIGN KEY ("idFormation") REFERENCES "Formation"("idFormation") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_numEtu_fkey" FOREIGN KEY ("numEtu") REFERENCES "Etudiant"("numEtu") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LienPj" ADD CONSTRAINT "LienPj_idDemarche_fkey" FOREIGN KEY ("idDemarche") REFERENCES "DemarcheEvenement"("idDemarche") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LienPj" ADD CONSTRAINT "LienPj_idPieceJointe_fkey" FOREIGN KEY ("idPieceJointe") REFERENCES "PieceJointe"("idPieceJointe") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PropositionTuteurUniv" ADD CONSTRAINT "PropositionTuteurUniv_idStage_fkey" FOREIGN KEY ("idStage") REFERENCES "Stage"("idStage") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PropositionTuteurUniv" ADD CONSTRAINT "PropositionTuteurUniv_numEnseignant_fkey" FOREIGN KEY ("numEnseignant") REFERENCES "Enseignant"("numEnseignant") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "QuotaEnseignant" ADD CONSTRAINT "QuotaEnseignant_idFormation_fkey" FOREIGN KEY ("idFormation") REFERENCES "Formation"("idFormation") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "QuotaEnseignant" ADD CONSTRAINT "QuotaEnseignant_numEnseignant_idDepartement_annee_fkey" FOREIGN KEY ("numEnseignant", "idDepartement", "annee") REFERENCES "AnneeEnseignant"("numEnseignant", "idDepartement", "annee") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RechercheStage" ADD CONSTRAINT "RechercheStage_annee_fkey" FOREIGN KEY ("annee") REFERENCES "AnneeUniversitaire"("annee") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RechercheStage" ADD CONSTRAINT "RechercheStage_idEntreprise_fkey" FOREIGN KEY ("idEntreprise") REFERENCES "Entreprise"("idEntreprise") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RechercheStage" ADD CONSTRAINT "RechercheStage_numEtu_fkey" FOREIGN KEY ("numEtu") REFERENCES "Etudiant"("numEtu") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Soutenance" ADD CONSTRAINT "Soutenance_annee_fkey" FOREIGN KEY ("annee") REFERENCES "AnneeUniversitaire"("annee") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Soutenance" ADD CONSTRAINT "Soutenance_idSalle_fkey" FOREIGN KEY ("idSalle") REFERENCES "Salle"("idSalle") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SoutenanceStage" ADD CONSTRAINT "SoutenanceStage_idSoutenance_fkey" FOREIGN KEY ("idSoutenance") REFERENCES "Soutenance"("idSoutenance") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SoutenanceStage" ADD CONSTRAINT "SoutenanceStage_idStage_fkey" FOREIGN KEY ("idStage") REFERENCES "Stage"("idStage") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_annee_fkey" FOREIGN KEY ("annee") REFERENCES "AnneeUniversitaire"("annee") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_idTuteurEntreprise_fkey" FOREIGN KEY ("idTuteurEntreprise") REFERENCES "TuteurEntreprise"("idTuteurEntreprise") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_numEnseignant_fkey" FOREIGN KEY ("numEnseignant") REFERENCES "Enseignant"("numEnseignant") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_numEtu_fkey" FOREIGN KEY ("numEtu") REFERENCES "Etudiant"("numEtu") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TuteurEntreprise" ADD CONSTRAINT "TuteurEntreprise_idEntreprise_fkey" FOREIGN KEY ("idEntreprise") REFERENCES "Entreprise"("idEntreprise") ON DELETE NO ACTION ON UPDATE NO ACTION;
