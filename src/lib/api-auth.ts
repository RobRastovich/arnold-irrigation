import { NextRequest } from 'next/server'
import { verifyToken, JWTPayload } from './auth'
import { featureKeyForPath } from './features'
import { userHasFeature } from './feature-access'

export type UserRole = 'ADMIN' | 'STAFF' | 'PATRON'

export interface AuthenticatedUser extends JWTPayload {}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) return null

    const featureKey = featureKeyForPath(request.nextUrl.pathname)
    if (!featureKey) return payload
    if (featureKey === 'features') {
      return payload.role === 'ADMIN' ? payload : null
    }

    const allowed = await userHasFeature(payload.userId, featureKey)
    return allowed ? payload : null
  } catch (error) {
    return null
  }
}

export function requireAuth(allowedRoles?: UserRole[]) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request)

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return user
  }
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 3,
    STAFF: 2,
    PATRON: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}
