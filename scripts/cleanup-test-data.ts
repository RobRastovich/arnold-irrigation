import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupTestData() {
  console.log('Cleaning up test data...')

  // Delete patrons with TEST- prefix in account number
  // This will cascade delete related turnouts, notes, etc.
  const result = await prisma.patron.deleteMany({
    where: {
      accountNumber: {
        startsWith: 'TEST-'
      }
    }
  })

  console.log(`Deleted ${result.count} test patrons and their related data`)

  // Also delete turnouts with TEST- prefix (in case any orphaned records exist)
  const turnoutResult = await prisma.turnout.deleteMany({
    where: {
      accountNumber: {
        startsWith: 'TEST-'
      }
    }
  })

  console.log(`Deleted ${turnoutResult.count} test turnouts`)

  await prisma.$disconnect()
  console.log('Cleanup complete!')
}

cleanupTestData().catch((error) => {
  console.error('Error cleaning up test data:', error)
  process.exit(1)
})
