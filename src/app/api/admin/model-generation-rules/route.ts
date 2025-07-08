import { NextRequest, NextResponse } from 'next/server'
import { ModelGenerationRuleModel } from '@/lib/models/ModelGenerationRule'
import { getUserFromToken } from '@/lib/auth'

// 获取所有型号生成规则
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

    let rules
    if (activeOnly) {
      rules = await ModelGenerationRuleModel.findActive()
    } else {
      rules = await ModelGenerationRuleModel.findAll()
    }

    // 初始化默认规则（如果没有规则）
    if (rules.length === 0) {
      await ModelGenerationRuleModel.initializeDefaultRules()
      rules = await ModelGenerationRuleModel.findAll()
    }

    return NextResponse.json({
      rules,
      total: rules.length
    })

  } catch (error) {
    console.error('获取型号生成规则失败:', error)
    return NextResponse.json(
      { error: '获取型号生成规则失败' },
      { status: 500 }
    )
  }
}

// 创建新的型号生成规则
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const ruleData = await request.json()

    // 验证必填字段
    if (!ruleData.name || !ruleData.template) {
      return NextResponse.json(
        { error: '规则名称和模板不能为空' },
        { status: 400 }
      )
    }

    // 验证模板格式
    const validation = ModelGenerationRuleModel.validateTemplate(ruleData.template)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `模板格式错误: ${validation.errors.join(', ')}` },
        { status: 400 }
      )
    }

    // 设置默认值
    const rule = await ModelGenerationRuleModel.create({
      ...ruleData,
      description: ruleData.description || '',
      variableMapping: ruleData.variableMapping || {},
      isDefault: ruleData.isDefault || false,
      isActive: ruleData.isActive !== false
    })

    return NextResponse.json({
      message: '型号生成规则创建成功',
      rule
    }, { status: 201 })

  } catch (error) {
    console.error('创建型号生成规则失败:', error)
    return NextResponse.json(
      { error: '创建型号生成规则失败' },
      { status: 500 }
    )
  }
}

// 测试型号生成
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { baseModel, variables, ruleId } = await request.json()

    if (!baseModel) {
      return NextResponse.json(
        { error: '基础型号不能为空' },
        { status: 400 }
      )
    }

    const generatedModel = await ModelGenerationRuleModel.generateModel(
      baseModel,
      variables || {},
      ruleId
    )

    return NextResponse.json({
      baseModel,
      variables,
      generatedModel
    })

  } catch (error) {
    console.error('测试型号生成失败:', error)
    return NextResponse.json(
      { error: '测试型号生成失败' },
      { status: 500 }
    )
  }
}

// 初始化默认规则
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    if (force) {
      // 强制重新初始化（删除现有规则）
      await ModelGenerationRuleModel.forceReinitializeDefaultRules()
    } else {
      // 普通初始化（如果已有规则则跳过）
      await ModelGenerationRuleModel.initializeDefaultRules()
    }

    const rules = await ModelGenerationRuleModel.findAll()

    return NextResponse.json({
      message: force ? '默认规则强制重新初始化成功' : '默认规则初始化成功',
      rules
    })

  } catch (error) {
    console.error('初始化默认规则失败:', error)
    return NextResponse.json(
      { error: '初始化默认规则失败' },
      { status: 500 }
    )
  }
}
