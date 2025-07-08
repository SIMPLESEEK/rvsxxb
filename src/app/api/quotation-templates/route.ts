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

// 获取用户的模板
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

// 更新用户模板
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { companyInfo, quotationNotes } = await request.json()

    // 验证必填字段
    if (!companyInfo || !companyInfo.name) {
      return NextResponse.json(
        { error: '公司名称不能为空' },
        { status: 400 }
      )
    }

    const template = await QuotationTemplateModel.createOrUpdate(user.userId, companyInfo, quotationNotes)

    return NextResponse.json({
      message: '模板更新成功',
      template
    })

  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json(
      { error: '更新模板失败' },
      { status: 500 }
    )
  }
}


