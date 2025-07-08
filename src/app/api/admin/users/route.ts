import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/lib/models/User'
import jwt from 'jsonwebtoken'
import { JWTPayload } from '@/types/auth'

async function getUserFromToken(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const users = await UserModel.findAll()

    // 移除密码字段
    const safeUsers = users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...safeUser } = user
      return safeUser
    })

    return NextResponse.json({
      users: safeUsers
    })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    )
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

    const { username, email, password, role } = await request.json()

    // 验证必填字段
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

    // 验证角色
    const validRoles = ['user', 'dealer', 'admin']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: '无效的用户角色' },
        { status: 400 }
      )
    }

    // 创建用户
    const newUser = await UserModel.create({
      username,
      email,
      password,
      role: role || 'user'
    })

    // 返回用户信息（不包含密码）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pwd, ...safeUser } = newUser

    return NextResponse.json({
      message: '用户创建成功',
      user: safeUser
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('Create user error:', error)

    if (error instanceof Error && (error.message === '用户名已存在' || error.message === '邮箱已存在')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: '创建用户失败，请稍后重试' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: '用户ID和角色不能为空' },
        { status: 400 }
      )
    }

    if (!['user', 'dealer', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: '无效的角色' },
        { status: 400 }
      )
    }

    const success = await UserModel.updateRole(userId, role)
    
    if (!success) {
      return NextResponse.json(
        { error: '更新用户角色失败' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '用户角色更新成功'
    })

  } catch (error) {
    console.error('Update user role error:', error)
    return NextResponse.json(
      { error: '更新用户角色失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID不能为空' },
        { status: 400 }
      )
    }

    // 防止删除当前登录的管理员
    const currentUserId = (user as any).id || (user as any)._id
    if (currentUserId === userId) {
      return NextResponse.json(
        { error: '不能删除当前登录的用户' },
        { status: 400 }
      )
    }

    const success = await UserModel.delete(userId)

    if (!success) {
      return NextResponse.json(
        { error: '用户不存在或删除失败' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '用户删除成功'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    )
  }
}
