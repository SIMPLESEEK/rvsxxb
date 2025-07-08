import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded
  } catch (error) {
    return null
  }
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as any
  } catch (error) {
    return null
  }
}

export function generateToken(payload: any, expiresIn: string = '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn })
}
