import { NextRequest, NextResponse } from 'next/server'
import { ColumnConfigModel } from '@/lib/models/ColumnConfig'

export async function POST(request: NextRequest) {
  try {
    console.log('初始化列配置API被调用')
    
    // 初始化默认列配置
    await ColumnConfigModel.initializeDefaultColumns()
    
    // 获取所有列配置验证
    const columns = await ColumnConfigModel.findAll()
    console.log(`初始化完成，共有 ${columns.length} 个列配置`)
    
    return NextResponse.json({
      success: true,
      message: '列配置初始化完成',
      count: columns.length,
      columns: columns.map(col => ({
        key: col.key,
        label: col.label,
        type: col.type,
        roles: col.roles
      }))
    })
    
  } catch (error) {
    console.error('初始化列配置失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '初始化列配置失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取所有列配置
    const columns = await ColumnConfigModel.findAll()
    
    return NextResponse.json({
      success: true,
      count: columns.length,
      columns
    })
    
  } catch (error) {
    console.error('获取列配置失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取列配置失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
