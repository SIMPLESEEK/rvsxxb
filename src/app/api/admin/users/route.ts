import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/lib/models/User'
import jwt from 'jsonwebtoken'

async function getUserFromToken(request: NextRequest) {
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
      const { password, ...safeUser } = user
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
