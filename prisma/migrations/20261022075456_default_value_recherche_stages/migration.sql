-- AlterTable
CREATE SEQUENCE recherchestage_idrecherche_seq;
ALTER TABLE "RechercheStage" ALTER COLUMN "idRecherche" SET DEFAULT nextval('recherchestage_idrecherche_seq'),
ALTER COLUMN "status" SET DEFAULT 'AttenteReponse';
ALTER SEQUENCE recherchestage_idrecherche_seq OWNED BY "RechercheStage"."idRecherche";
