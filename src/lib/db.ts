import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; currentUserId?: string; currentUserName?: string }

// In Lambda/serverless environments, use a single connection with no pool timeout
// to avoid "Can't reach database" errors on cold starts
function createPrismaClient() {
  const url = process.env.DATABASE_URL
  const datasourceUrl = url && !url.includes('connection_limit')
    ? `${url}?connection_limit=1&pool_timeout=0&connect_timeout=30`
    : url

  const prisma = new PrismaClient({
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  // Add middleware for audit logging
  prisma.$use(async (params: any, next: any) => {
    // Skip audit logging for read operations and the audit log table itself
    if (!['create', 'update', 'delete'].includes(params.action) || params.model === 'AuditLog') {
      return next(params)
    }

    // For UPDATE, fetch old record before the operation
    let oldRecord: any = null
    if (params.action === 'update' && params.args?.where?.id) {
      try {
        const modelName = params.model.charAt(0).toLowerCase() + params.model.slice(1)
        const model = (prisma as any)[modelName]
        if (model && model.findUnique) {
          oldRecord = await model.findUnique({
            where: { id: params.args.where.id },
          })
        }
      } catch (error) {
        // Ignore error if we can't fetch old record
      }
    }

    const result = await next(params)

    const currentUserName = globalForPrisma.currentUserName || 'System'

    // Determine table name from model
    const tableName = params.model

    // Get record ID
    const recordId = params.args?.where?.id || result?.id || 'unknown'

    // Build changes object
    let changes: any = {}

    if (params.action === 'create') {
      changes = { created: result }
    } else if (params.action === 'update') {
      // Compare old and new records
      if (oldRecord && result) {
        const fieldChanges: any = {}
        for (const key in result) {
          // Skip system fields and nested objects/arrays
          if (key !== 'updatedAt' && key !== 'id' && key !== 'createdAt') {
            const oldValue = oldRecord[key]
            const newValue = result[key]

            // Only log scalar values (skip objects, arrays, null)
            const isScalar = newValue === null ||
              typeof newValue === 'string' ||
              typeof newValue === 'number' ||
              typeof newValue === 'boolean' ||
              newValue instanceof Date

            if (isScalar && oldValue !== newValue) {
              fieldChanges[key] = {
                old: oldValue,
                new: newValue,
              }
            }
          }
        }
        changes = fieldChanges
      } else {
        // Fallback if we couldn't fetch old record
        changes = { updated: params.args.data }
      }
    } else if (params.action === 'delete') {
      changes = { deleted: params.args.where }
    }

    // Create audit log entry
    try {
      await prisma.auditLog.create({
        data: {
          tableName,
          recordId,
          action: params.action.toUpperCase(),
          changedBy: currentUserName,
          changes,
        },
      })
    } catch (error) {
      // Don't fail the operation if audit logging fails
      console.error('Failed to create audit log:', error)
    }

    return result
  })

  return prisma
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as any)[prop]
  },
})

// Helper to set current user for audit logging
export function setCurrentUserId(userId: string, userName?: string) {
  globalForPrisma.currentUserId = userId
  globalForPrisma.currentUserName = userName
}

export function clearCurrentUserId() {
  globalForPrisma.currentUserId = undefined
  globalForPrisma.currentUserName = undefined
}
