import { prisma } from "~~/server/utils/prisma";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const idDepartement = Number(query.idDepartement);

    if (!Number.isInteger(idDepartement)) {
        throw createError({
            statusCode: 400,
            statusMessage: "idDepartement doit être un entier",
        });
    }

    const currentYear: string = "2026-2027"; // TODO (manuel): attribution dynamique de l'année en cours

    const [formations, stages, soutenances] = await prisma.$transaction([
        prisma.formation.findMany({
            where: {
                idDepartement,
            },
            select: {
                nomFormation: true,
                alternance: true,
                Inscription: {
                    where: {
                        annee: currentYear,
                    },
                    select: {
                        numEtu: true,
                    },
                },
            },
        }),
        prisma.stage.findMany({
            where: {
                annee: currentYear,
                Etudiant: {
                    Inscription: {
                        some: {
                            annee: currentYear,
                            Formation: {
                                idDepartement,
                            },
                        },
                    },
                },
            },
            select: {
                idStage: true,
                numEtu: true,
            },
        }),
        prisma.soutenance.findMany({
            where: {
                annee: currentYear,
                SoutenanceStage: {
                    some: {
                        Stage: {
                            annee: currentYear,
                            Etudiant: {
                                Inscription: {
                                    some: {
                                        annee: currentYear,
                                        Formation: {
                                            idDepartement,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            select: {
                idSoutenance: true,
                SoutenanceStage: {
                    select: {
                        idStage: true,
                    },
                },
            },
        }),
    ]);

    return formations.map(({ nomFormation, alternance, Inscription }) => {
        const studentNumbers = new Set(
            Inscription.map(({ numEtu }) => numEtu),
        );
        const formationStageIds = new Set(
            stages
                .filter(({ numEtu }) => studentNumbers.has(numEtu))
                .map(({ idStage }) => idStage),
        );
        const formationSoutenanceIds = new Set(
            soutenances
                .filter(({ SoutenanceStage }) =>
                    SoutenanceStage.some(({ idStage }) =>
                        formationStageIds.has(idStage),
                    ),
                )
                .map(({ idSoutenance }) => idSoutenance),
        );

        return {
            name: nomFormation,
            alternance,
            stages: formationStageIds.size,
            soutenances: formationSoutenanceIds.size,
        };
    });
});
