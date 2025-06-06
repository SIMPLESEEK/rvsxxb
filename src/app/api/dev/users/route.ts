import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/lib/models/User'

// 仅在开发环境使用的API
export async function GET(request: NextRequest) {
  // 仅在开发环境允许访问
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '此API仅在开发环境可用' },
      { status: 403 }
    )
  }

  try {
    const users = await UserModel.findAll()
    
    // 返回用户信息（不包含密码哈希）
    const safeUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      note: '密码已加密，无法显示明文'
    }))

    return NextResponse.json({
      message: '开发环境用户列表',
      users: safeUsers,
      note: '建议使用以下测试账户：',
      testAccounts: [
        {
          username: 'admin',
          password: 'admin123456',
          role: 'admin',
          note: '管理员账户（需要运行初始化脚本创建）'
        },
        {
          username: 'dealer1',
          password: 'dealer123',
          role: 'dealer',
          note: '经销商测试账户'
        },
        {
          username: 'user1',
          password: 'user123',
          role: 'user',
          note: '普通用户测试账户'
        }
      ]
    })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    )
  }
}
