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

// 获取所有变量配置
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    let configs
    if (activeOnly) {
      configs = await VariableConfigModel.findActive()
    } else {
      configs = await VariableConfigModel.findAll()
    }

    // 初始化默认配置（如果没有配置）
    if (configs.length === 0) {
      await VariableConfigModel.initializeDefaultConfigs()
      configs = await VariableConfigModel.findAll()
    }

    return NextResponse.json({
      configs,
      total: configs.length
    })

  } catch (error) {
    console.error('获取变量配置失败:', error)
    return NextResponse.json(
      { error: '获取变量配置失败' },
      { status: 500 }
    )
  }
}

// 创建新的变量配置
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const configData = await request.json()

    // 验证必填字段
    if (!configData.type || !configData.label || !configData.options) {
      return NextResponse.json(
        { error: '变量类型、标签和选项不能为空' },
        { status: 400 }
      )
    }

    // 验证选项格式
    if (!Array.isArray(configData.options) || configData.options.length === 0) {
      return NextResponse.json(
        { error: '至少需要一个变量选项' },
        { status: 400 }
      )
    }

    // 检查是否已存在相同类型的配置
    const existingConfig = await VariableConfigModel.findByType(configData.type)
    if (existingConfig) {
      return NextResponse.json(
        { error: '该变量类型的配置已存在' },
        { status: 400 }
      )
    }

    // 设置默认值
    const config = await VariableConfigModel.create({
      ...configData,
      isRequired: configData.isRequired !== false,
      allowMultiple: configData.allowMultiple || false,
      order: configData.order || 999,
      isActive: configData.isActive !== false
    })

    // 自动同步到列配置
    await syncVariableToColumn(config)

    return NextResponse.json({
      message: '变量配置创建成功',
      config
    }, { status: 201 })

  } catch (error) {
    console.error('创建变量配置失败:', error)
    return NextResponse.json(
      { error: '创建变量配置失败' },
      { status: 500 }
    )
  }
}

// 批量更新变量配置
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { updates } = await request.json()

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: '更新数据格式错误' },
        { status: 400 }
      )
    }

    const results = []
    for (const update of updates) {
      if (!update.id) {
        continue
      }

      try {
        const updatedConfig = await VariableConfigModel.update(update.id, update.data)
        if (updatedConfig) {
          results.push(updatedConfig)
        }
      } catch (error) {
        console.error(`更新配置 ${update.id} 失败:`, error)
      }
    }

    return NextResponse.json({
      message: `成功更新 ${results.length} 个配置`,
      configs: results
    })

  } catch (error) {
    console.error('批量更新变量配置失败:', error)
    return NextResponse.json(
      { error: '批量更新变量配置失败' },
      { status: 500 }
    )
  }
}

// 初始化默认配置
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    await VariableConfigModel.initializeDefaultConfigs()

    const configs = await VariableConfigModel.findAll()

    return NextResponse.json({
      message: '默认配置初始化成功',
      configs
    })

  } catch (error) {
    console.error('初始化默认配置失败:', error)
    return NextResponse.json(
      { error: '初始化默认配置失败' },
      { status: 500 }
    )
  }
}
