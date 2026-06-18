import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@arnoldid.com' },
    update: {},
    create: {
      email: 'admin@arnoldid.com',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      address: '123 Irrigation Way',
      city: 'Bend',
      state: 'OR',
      zip: '97701',
      phone: '541-555-0001',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
      timezone: 'America/Los_Angeles',
    },
  })

  console.log('Created admin user:', admin.email)

  // Create staff user
  const staffPassword = await bcrypt.hash('Staff123!', 10)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@arnoldid.com' },
    update: {},
    create: {
      email: 'staff@arnoldid.com',
      passwordHash: staffPassword,
      firstName: 'Staff',
      lastName: 'User',
      address: '123 Irrigation Way',
      city: 'Bend',
      state: 'OR',
      zip: '97701',
      phone: '541-555-0002',
      role: 'STAFF',
      isActive: true,
      emailVerified: true,
      timezone: 'America/Los_Angeles',
    },
  })

  console.log('Created staff user:', staff.email)

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
