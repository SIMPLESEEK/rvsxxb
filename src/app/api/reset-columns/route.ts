import { NextRequest, NextResponse } from 'next/server'
import { ColumnConfigModel } from '@/lib/models/ColumnConfig'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    console.log('重置列配置API被调用')

    // 获取数据库连接
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const collection = db.collection('columnConfigs')

    // 备份现有的列配置
    const existingColumns = await collection.find({}).toArray()
    console.log(`备份了 ${existingColumns.length} 个现有列配置`)

    // 保存自定义列（隐藏的列）
    const customColumns = existingColumns.filter(col => !col.isVisible)
    console.log(`找到 ${customColumns.length} 个自定义列需要保护`)

    // 删除所有现有的列配置
    const deleteResult = await collection.deleteMany({})
    console.log(`删除了 ${deleteResult.deletedCount} 个现有列配置`)

    // 重新初始化默认列配置
    await ColumnConfigModel.initializeDefaultColumns()

    // 恢复自定义列
    if (customColumns.length > 0) {
      // 移除_id字段，让MongoDB重新生成
      const columnsToRestore = customColumns.map(col => {
        const { _id, ...columnWithoutId } = col
        return columnWithoutId
      })

      await collection.insertMany(columnsToRestore)
      console.log(`恢复了 ${customColumns.length} 个自定义列`)
    }

    // 获取所有列配置验证
    const columns = await ColumnConfigModel.findAll()
    console.log(`重新初始化完成，共有 ${columns.length} 个列配置`)

    return NextResponse.json({
      success: true,
      message: '列配置重置完成（已保护自定义列）',
      deletedCount: deleteResult.deletedCount,
      restoredCustomColumns: customColumns.length,
      newCount: columns.length,
      columns: columns.map(col => ({
        key: col.key,
        label: col.label,
        type: col.type,
        width: col.width,
        bg: col.bg,
        roles: col.roles,
        order: col.order,
        isVisible: col.isVisible
      }))
    })

  } catch (error) {
    console.error('重置列配置失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '重置列配置失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
