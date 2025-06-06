import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({
    message: '登出成功'
  })

  // 清除认证cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  })

  return response
}
