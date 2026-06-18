const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateTimezone() {
  try {
    // Update admin user
    await prisma.user.update({
      where: { email: 'admin@arnoldid.com' },
      data: { timezone: 'America/Los_Angeles' }
    })
    console.log('✅ Updated admin user timezone')

    // Update staff user
    await prisma.user.update({
      where: { email: 'staff@arnoldid.com' },
      data: { timezone: 'America/Los_Angeles' }
    })
    console.log('✅ Updated staff user timezone')

    // Update any users without timezone
    const result = await prisma.user.updateMany({
      where: { timezone: null },
      data: { timezone: 'America/Los_Angeles' }
    })
    console.log(`✅ Updated ${result.count} users with null timezone`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateTimezone()
