import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { JWTPayload } from '@/types/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload

    const userResponse = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    }

    return NextResponse.json({
      user: userResponse
    })

  } catch (error) {
    console.error('Get user info error:', error)
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 401 }
    )
  }
}
