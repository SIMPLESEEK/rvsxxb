import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '../../../../lib/models/User'

export async function POST(request: NextRequest) {
  try {
    console.log('登录测试API被调用')
    
    const { username, password } = await request.json()
    console.log('登录请求:', { username, password: '***' })

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    // 查找用户
    console.log('查找用户:', username)
    const user = await UserModel.findByUsername(username)
    console.log('找到用户:', user ? '是' : '否')
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 验证密码
    console.log('验证密码...')
    const isValidPassword = await UserModel.verifyPassword(password, user.password!)
    console.log('密码验证结果:', isValidPassword)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      )
    }

    // 返回成功信息（简化版，不生成JWT）
    return NextResponse.json({
      message: '登录成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('登录测试错误:', error)
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}
