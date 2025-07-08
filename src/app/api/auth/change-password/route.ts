import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { UserModel } from '@/lib/models/User'
import { JWTPayload } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '当前密码和新密码不能为空' },
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

    // 查找用户
    const user = await UserModel.findById(decoded.id)
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 验证当前密码
    const isValidPassword = await UserModel.verifyPassword(currentPassword, user.password!)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '当前密码错误' },
        { status: 401 }
      )
    }

    // 更新密码
    const userId = (decoded as any).userId || (decoded as any).id
    const success = await UserModel.updatePassword(userId, newPassword)
    if (!success) {
      return NextResponse.json(
        { error: '密码更新失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '密码修改成功'
    })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: '密码修改失败' },
      { status: 500 }
    )
  }
}
