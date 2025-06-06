import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '../../../lib/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // 创建测试用户
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'dealer',
        email: 'dealer@test.com',
        password: 'dealer123',
        role: 'dealer'
      },
      {
        username: 'user',
        email: 'user@test.com',
        password: 'user123',
        role: 'user'
      }
    ]

    const createdUsers = []

    for (const userData of testUsers) {
      // 检查用户是否已存在
      const existingUser = await UserModel.findByUsername(userData.username)
      
      if (!existingUser) {
        // 加密密码
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        
        // 创建用户
        const user = await UserModel.create({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          role: userData.role as 'user' | 'dealer' | 'admin'
        })
        
        createdUsers.push({
          username: userData.username,
          email: userData.email,
          role: userData.role
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: '测试用户创建完成',
      createdUsers,
      loginInfo: [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'dealer', password: 'dealer123', role: 'dealer' },
        { username: 'user', password: 'user123', role: 'user' }
      ]
    })

  } catch (error) {
    console.error('创建测试用户失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '创建测试用户失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
