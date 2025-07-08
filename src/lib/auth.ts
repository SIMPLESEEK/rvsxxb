import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { JWTPayload } from '@/types/auth'

export async function getUserFromToken(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    return decoded
  } catch {
    return null
  }
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
  } catch {
    return null
  }
}

export function generateToken(payload: JWTPayload, expiresIn: string = '7d'): string {
  const secret = process.env.JWT_SECRET || 'default-secret'
  return (jwt.sign as any)(payload, secret, { expiresIn })
}
