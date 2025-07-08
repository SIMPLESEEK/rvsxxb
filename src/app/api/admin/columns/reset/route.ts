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

    console.log('开始重置列配置...')

    // 删除所有现有的列配置
    const deletedCount = await ColumnConfigModel.deleteAll()
    console.log('删除了', deletedCount, '个现有列配置')
    
    // 重新初始化默认列配置
    await ColumnConfigModel.initializeDefaultColumns()
    console.log('重新初始化默认列配置完成')
    
    // 获取新的列配置
    const newColumns = await ColumnConfigModel.findAll()
    console.log('新的列配置数量:', newColumns.length)

    return NextResponse.json({
      message: '列配置重置成功',
      deletedCount: deletedCount,
      newColumnsCount: newColumns.length,
      columns: newColumns.map(col => ({
        key: col.key,
        label: col.label,
        type: col.type,
        order: col.order,
        isVisible: col.isVisible
      }))
    })

  } catch (error) {
    console.error('Reset columns error:', error)
    return NextResponse.json(
      { error: '重置列配置失败', details: error },
      { status: 500 }
    )
  }
}
