import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: '用户名、邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6位' },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      )
    }

    // 创建用户（默认角色为user）
    const user = await UserModel.create({
      username,
      email,
      password,
      role: 'user'
    })

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }

    return NextResponse.json({
      message: '注册成功',
      user: userResponse
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('Register error:', error)
    
    if (error instanceof Error && (error.message === '用户名已存在' || error.message === '邮箱已存在')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
