import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { FEATURE_CATALOG } from '../src/lib/features'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Arnold-06172026', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@arnoldid.com' },
    update: {
      passwordHash: adminPassword,
      isActive: true,
      role: 'ADMIN',
    },
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
    update: {
      passwordHash: staffPassword,
      isActive: true,
    },
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

  const existingFeatureCount = await prisma.feature.count()
  for (const feature of FEATURE_CATALOG) {
    await prisma.feature.upsert({
      where: { key: feature.key },
      update: {
        name: feature.name,
        href: feature.href,
        icon: feature.icon,
        sortOrder: feature.sortOrder,
      },
      create: {
        key: feature.key,
        name: feature.name,
        href: feature.href,
        icon: feature.icon,
        sortOrder: feature.sortOrder,
      },
    })
  }
  console.log('Upserted features')

  if (existingFeatureCount === 0) {
    const features = await prisma.feature.findMany()
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] } },
      select: { id: true, role: true },
    })
    for (const user of staffUsers) {
      for (const feature of features) {
        if (feature.key === 'users' && user.role !== 'ADMIN') continue
        await prisma.userFeature.upsert({
          where: { userId_featureId: { userId: user.id, featureId: feature.id } },
          update: {},
          create: { userId: user.id, featureId: feature.id },
        })
      }
    }
    console.log('Granted all features to existing admin and staff users')
  } else {
    const storageFeature = await prisma.feature.findUnique({ where: { key: 'storage-reports' } })
    if (storageFeature) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const user of admins) {
        await prisma.userFeature.upsert({
          where: { userId_featureId: { userId: user.id, featureId: storageFeature.id } },
          update: {},
          create: { userId: user.id, featureId: storageFeature.id },
        })
      }
      console.log('Granted storage-reports to ADMIN users')
    }
  }

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
