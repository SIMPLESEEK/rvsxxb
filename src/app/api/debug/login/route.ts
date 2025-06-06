import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug login API called')
    
    const { username, password } = await request.json()
    console.log('📝 Received credentials:', { username, password: '***' })

    if (!username || !password) {
      console.log('❌ Missing username or password')
      return NextResponse.json(
        { error: '用户名和密码不能为空', debug: 'missing_credentials' },
        { status: 400 }
      )
    }

    // 测试数据库连接
    console.log('🔗 Testing database connection...')
    try {
      const user = await UserModel.findByUsername(username)
      console.log('👤 User found:', user ? 'YES' : 'NO')
      
      if (user) {
        console.log('📊 User details:', {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          hasPassword: !!user.password
        })
      }

      if (!user) {
        return NextResponse.json(
          { 
            error: '用户不存在', 
            debug: 'user_not_found',
            searchedUsername: username
          },
          { status: 404 }
        )
      }

      // 测试密码验证
      console.log('🔐 Testing password verification...')
      const isValidPassword = await UserModel.verifyPassword(password, user.password!)
      console.log('✅ Password valid:', isValidPassword)

      if (!isValidPassword) {
        return NextResponse.json(
          { 
            error: '密码错误', 
            debug: 'invalid_password'
          },
          { status: 401 }
        )
      }

      // 测试JWT生成
      console.log('🎫 Testing JWT generation...')
      const jwt = require('jsonwebtoken')
      const jwtSecret = process.env.JWT_SECRET
      console.log('🔑 JWT Secret exists:', !!jwtSecret)

      if (!jwtSecret) {
        return NextResponse.json(
          { 
            error: 'JWT密钥未配置', 
            debug: 'missing_jwt_secret'
          },
          { status: 500 }
        )
      }

      const token = jwt.sign(
        {
          userId: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        jwtSecret,
        { expiresIn: '7d' }
      )

      console.log('🎉 Login successful for user:', username)

      return NextResponse.json({
        message: '调试登录成功',
        debug: 'success',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token: token.substring(0, 20) + '...' // 只显示token的前20个字符
      })

    } catch (dbError) {
      console.error('💥 Database error:', dbError)
      return NextResponse.json(
        { 
          error: '数据库连接失败', 
          debug: 'database_error',
          details: dbError instanceof Error ? dbError.message : '未知数据库错误'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 Debug login error:', error)
    return NextResponse.json(
      { 
        error: '调试登录失败', 
        debug: 'general_error',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
