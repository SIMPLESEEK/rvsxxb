import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '../../../lib/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // 创建admin用户
    const adminUser = {
      username: 'admin',
      email: 'admin@xxbaug.com',
      password: 'admin123',
      role: 'admin' as const
    }

    // 检查用户是否已存在
    const existingUser = await UserModel.findByUsername(adminUser.username)
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'admin用户已存在',
        user: {
          username: existingUser.username,
          email: existingUser.email,
          role: existingUser.role
        }
      })
    }

    // 创建用户
    const user = await UserModel.create(adminUser)
    
    return NextResponse.json({
      success: true,
      message: 'admin用户创建成功',
      user: {
        username: user.username,
        email: user.email,
        role: user.role
      },
      loginInfo: {
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      }
    })

  } catch (error) {
    console.error('创建admin用户失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '创建admin用户失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
