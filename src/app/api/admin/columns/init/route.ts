import { NextRequest, NextResponse } from 'next/server'
import { ColumnConfigModel } from '@/lib/models/ColumnConfig'
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

    await ColumnConfigModel.initializeDefaultColumns()

    return NextResponse.json({
      message: '默认列配置初始化成功'
    })

  } catch (error) {
    console.error('Initialize columns error:', error)
    return NextResponse.json(
      { error: '初始化列配置失败' },
      { status: 500 }
    )
  }
}
