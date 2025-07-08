import { NextRequest, NextResponse } from 'next/server'
import { ColumnConfigModel } from '@/lib/models/ColumnConfig'
import { getUserFromToken } from '@/lib/auth'

// 获取用户可见的列配置（不需要管理员权限）
export async function GET(request: NextRequest) {
  try {
    // 获取用户信息
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 获取所有可见的列配置
    const allColumns = await ColumnConfigModel.findVisible()
    console.log(`找到 ${allColumns.length} 个可见列配置`)

    // 根据用户角色过滤列配置
    const userColumns = allColumns.filter(column => 
      column.roles.includes(user.role) && column.isVisible
    )

    return NextResponse.json({
      columns: userColumns
    })

  } catch (error) {
    console.error('Get columns error:', error)
    return NextResponse.json(
      { error: '获取列配置失败' },
      { status: 500 }
    )
  }
}
