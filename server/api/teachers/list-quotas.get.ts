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

    const currentYear: string = "2026-2027"; // TODO: attribution dynamique de l'année en cours

    const teachersWithQuotas = await prisma.enseignant.findMany({
        where: {
            AnneeEnseignant: {
                some: {
                    idDepartement,
                    annee: currentYear,
                },
            },
        },
        select: {
            nom: true,
            prenom: true,
            AnneeEnseignant: {
                where: {
                    idDepartement,
                    annee: currentYear,
                },
                select: {
                    QuotaEnseignant: {
                        select: {
                            idFormation: true,
                            quotaTuteurs: true,
                            Formation: {
                                select: {
                                    nomFormation: true,
                                    alternance: true,
                                },
                            },
                        },
                    },
                },
            },
            Stage: {
                where: {
                    annee: currentYear,
                },
                select: {
                    idStage: true,
                    Etudiant: {
                        select: {
                            Inscription: {
                                where: {
                                    annee: currentYear,
                                },
                                select: {
                                    idFormation: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    return teachersWithQuotas.map(
        ({ nom, prenom, AnneeEnseignant, Stage }) => ({
            "Nom": [nom?.toUpperCase(), prenom].filter(Boolean).join(" "),
            ...Object.fromEntries(
                AnneeEnseignant.flatMap(({ QuotaEnseignant }) =>
                    QuotaEnseignant.map(
                        ({ idFormation, Formation, quotaTuteurs }) => {
                            const stageCount = Stage.filter(({ Etudiant }) =>
                                Etudiant.Inscription.some(
                                    (inscription) =>
                                        inscription.idFormation === idFormation,
                                ),
                            ).length;

                            return [
                                `${Formation.alternance ? "Alternance" : "Stage"} ${Formation.nomFormation}`,
                                `${stageCount}/${quotaTuteurs}`,
                            ];
                        },
                    ),
                ),
            ),
        }),
    );
});
