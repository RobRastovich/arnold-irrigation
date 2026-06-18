const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupAuditLogs() {
  try {
    // Delete all audit logs where tableName is 'AuditLog'
    const result = await prisma.auditLog.deleteMany({
      where: {
        tableName: 'AuditLog'
      }
    })

    console.log(`Deleted ${result.count} audit log records for AuditLog table`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupAuditLogs()
