import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { UserModel } from '@/lib/models/User'
import { JWTPayload } from '@/types/auth'

async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    return decoded
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: '用户ID和新密码不能为空' },
        { status: 400 }
      )
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码长度至少6位' },
        { status: 400 }
      )
    }

    // 查找目标用户
    const targetUser = await UserModel.findById(userId)
    if (!targetUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 更新密码
    const success = await UserModel.updatePassword(userId, newPassword)
    if (!success) {
      return NextResponse.json(
        { error: '密码重置失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `用户 ${targetUser.username} 的密码已重置成功`
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: '密码重置失败' },
      { status: 500 }
    )
  }
}
