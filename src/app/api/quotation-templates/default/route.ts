import { NextRequest, NextResponse } from 'next/server'
import { QuotationTemplateModel } from '@/lib/models/QuotationTemplate'
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

// 获取用户的模板（与主路由相同，保持兼容性）
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const template = await QuotationTemplateModel.getOrCreateTemplate(user.userId, user.role)

    return NextResponse.json({
      template
    })

  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json(
      { error: '获取模板失败' },
      { status: 500 }
    )
  }
}
