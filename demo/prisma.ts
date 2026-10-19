import { prisma } from '../lib/prisma'

async function main() {
  // Create a new user with a post
  const user = await prisma.etudiant.create({
    data: {
      numEtu: 'o22407574',
      nom: 'Fantin',
      prenom: 'Maxime',
      email: 'maxime@etu.fr',
      Auth: {
        create: {
          login: 'o22407574',
          password: 'lemotdepasse'
        }
      }
    },
    include: {
      Auth: true
    }
  })
  console.log('Created user:', user)

  // Fetch all users with their posts
  const allUsers = await prisma.etudiant.findMany({
    include: {
      Auth: true
    }
  })
  console.log('All users:', JSON.stringify(allUsers, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
