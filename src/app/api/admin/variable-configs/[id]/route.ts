import { NextRequest, NextResponse } from 'next/server'
import { VariableConfigModel } from '@/lib/models/VariableConfig'
import { ColumnConfigModel } from '@/lib/models/ColumnConfig'
import { getUserFromToken } from '@/lib/auth'

// 自动创建或更新对应的列配置
async function syncVariableToColumn(variableConfig: any) {
  try {
    // 根据变量类型确定列的key
    let columnKey = variableConfig.type

    // 特殊映射：某些变量类型需要映射到不同的列key
    const keyMapping: { [key: string]: string } = {
      'appearanceColor': 'appearance.color',
      'controlMethod': 'control'
    }

    if (keyMapping[variableConfig.type]) {
      columnKey = keyMapping[variableConfig.type]
    }

    // 检查是否已存在对应的列配置
    const existingColumns = await ColumnConfigModel.findAll()
    const existingColumn = existingColumns.find(col => col.key === columnKey)

    if (!existingColumn) {
      // 创建新的列配置
      const newColumn = {
        key: columnKey,
        label: variableConfig.label,
        type: 'variable' as const,
        roles: ['user', 'dealer', 'admin'],
        width: '7%',
        bg: '#e6f3ff',
        order: 10 + existingColumns.filter(col => col.type === 'variable').length,
        isVisible: true
      }

      await ColumnConfigModel.create(newColumn)
      console.log(`自动创建列配置: ${columnKey} - ${variableConfig.label}`)
    } else {
      // 更新现有列配置的标签（如果变量配置的标签发生了变化）
      if (existingColumn.label !== variableConfig.label) {
        await ColumnConfigModel.update(existingColumn._id!, { label: variableConfig.label })
        console.log(`更新列配置标签: ${columnKey} - ${variableConfig.label}`)
      }
    }
  } catch (error) {
    console.error('同步变量配置到列配置失败:', error)
    // 不抛出错误，避免影响变量配置的创建
  }
}

// 获取单个变量配置
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { id } = await params
    const config = await VariableConfigModel.findById(id)
    
    if (!config) {
      return NextResponse.json(
        { error: '变量配置不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ config })

  } catch (error) {
    console.error('获取变量配置失败:', error)
    return NextResponse.json(
      { error: '获取变量配置失败' },
      { status: 500 }
    )
  }
}

// 更新变量配置
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const updateData = await request.json()
    const { id } = await params

    console.log('更新变量配置 - ID:', id)
    console.log('更新变量配置 - 数据:', updateData)

    // 验证选项格式（如果提供了选项）
    if (updateData.options) {
      if (!Array.isArray(updateData.options) || updateData.options.length === 0) {
        return NextResponse.json(
          { error: '至少需要一个变量选项' },
          { status: 400 }
        )
      }
    }

    const config = await VariableConfigModel.update(id, updateData)

    if (!config) {
      return NextResponse.json(
        { error: '变量配置不存在' },
        { status: 404 }
      )
    }

    // 自动同步到列配置
    await syncVariableToColumn(config)

    return NextResponse.json({
      message: '变量配置更新成功',
      config
    })

  } catch (error) {
    console.error('更新变量配置失败:', error)
    return NextResponse.json(
      { error: '更新变量配置失败' },
      { status: 500 }
    )
  }
}

// 删除变量配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { id } = await params
    const success = await VariableConfigModel.delete(id)
    
    if (!success) {
      return NextResponse.json(
        { error: '变量配置不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '变量配置删除成功'
    })

  } catch (error) {
    console.error('删除变量配置失败:', error)
    return NextResponse.json(
      { error: '删除变量配置失败' },
      { status: 500 }
    )
  }
}
