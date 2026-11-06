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

    const [formations, stages] = await prisma.$transaction([
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
    ]);

    return formations.map(({ nomFormation, alternance, Inscription }) => {
        const formationStages = stages.filter(
            ({ numEtu }) =>
                Inscription.some(
                    (inscription) => inscription.numEtu === numEtu,
                ),
        );
        const stageIds = new Set(
            formationStages.map(({ idStage }) => idStage),
        );

        return {
            name: nomFormation,
            etudiants: Inscription.length,
            alternance,
            stages: stageIds.size,
        };
    });
});
