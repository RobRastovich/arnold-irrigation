import { prisma } from '@/lib/db'
import { FEATURE_CATALOG } from '@/lib/features'

let seedPromise: Promise<void> | null = null

export async function ensureFeaturesSeeded() {
  if (!seedPromise) {
    seedPromise = seedFeatures().catch((error) => {
      seedPromise = null
      throw error
    })
  }
  return seedPromise
}

async function seedFeatures() {
  const existingCount = await prisma.feature.count()

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

  if (existingCount === 0) {
    const features = await prisma.feature.findMany()
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] } },
      select: { id: true, role: true },
    })

    for (const user of staffUsers) {
      for (const feature of features) {
        if (feature.key === 'users' && user.role !== 'ADMIN') continue
        await prisma.userFeature.upsert({
          where: {
            userId_featureId: { userId: user.id, featureId: feature.id },
          },
          update: {},
          create: { userId: user.id, featureId: feature.id },
        })
      }
    }
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
    }
  }
}

export async function getUserFeatureKeys(userId: string): Promise<string[]> {
  await ensureFeaturesSeeded()
  const assignments = await prisma.userFeature.findMany({
    where: { userId },
    include: { feature: { select: { key: true } } },
  })
  return assignments.map((assignment) => assignment.feature.key)
}

export async function userHasFeature(userId: string, featureKey: string): Promise<boolean> {
  const keys = await getUserFeatureKeys(userId)
  return keys.includes(featureKey)
}

export async function replaceUserFeatures(userId: string, featureIds: string[]) {
  await prisma.userFeature.deleteMany({ where: { userId } })
  if (featureIds.length === 0) return
  await prisma.userFeature.createMany({
    data: featureIds.map((featureId) => ({ userId, featureId })),
    skipDuplicates: true,
  })
}
