import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { VariableConfigModel } from '@/lib/models/VariableConfig'
import { ModelGenerationRuleModel } from '@/lib/models/ModelGenerationRule'

// 初始化所有配置数据（调试用）
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 临时允许所有登录用户访问调试功能
    // if (user.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: '权限不足' },
    //     { status: 403 }
    //   )
    // }

    console.log('开始初始化配置数据...')

    // 1. 强制重新初始化变量配置
    console.log('强制重新初始化变量配置...')
    await VariableConfigModel.clearAll()
    await VariableConfigModel.initializeDefaultConfigs()
    const variableConfigs = await VariableConfigModel.findAll()
    console.log(`变量配置初始化完成，共 ${variableConfigs.length} 个配置`)

    // 2. 强制重新初始化型号生成规则
    console.log('强制重新初始化型号生成规则...')
    await ModelGenerationRuleModel.forceReinitializeDefaultRules()
    const modelRules = await ModelGenerationRuleModel.findAll()
    console.log(`型号生成规则初始化完成，共 ${modelRules.length} 个规则`)

    return NextResponse.json({
      message: '所有配置数据强制重新初始化成功',
      data: {
        variableConfigs: {
          count: variableConfigs.length,
          configs: variableConfigs
        },
        modelRules: {
          count: modelRules.length,
          rules: modelRules
        }
      }
    })

  } catch (error) {
    console.error('初始化配置数据失败:', error)
    return NextResponse.json(
      { error: '初始化配置数据失败', details: error.message },
      { status: 500 }
    )
  }
}

// 检查配置数据状态
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 临时允许所有登录用户访问调试功能
    // if (user.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: '权限不足' },
    //     { status: 403 }
    //   )
    // }

    console.log('检查配置数据状态...')

    // 检查变量配置
    const variableConfigs = await VariableConfigModel.findAll()
    const activeVariableConfigs = await VariableConfigModel.findActive()
    
    // 检查型号生成规则
    const modelRules = await ModelGenerationRuleModel.findAll()
    const activeModelRules = await ModelGenerationRuleModel.findActive()
    const defaultModelRule = await ModelGenerationRuleModel.findDefault()

    return NextResponse.json({
      message: '配置数据状态检查完成',
      data: {
        variableConfigs: {
          total: variableConfigs.length,
          active: activeVariableConfigs.length,
          configs: variableConfigs.map(config => ({
            _id: config._id,
            type: config.type,
            label: config.label,
            optionsCount: config.options.length,
            isActive: config.isActive
          }))
        },
        modelRules: {
          total: modelRules.length,
          active: activeModelRules.length,
          hasDefault: !!defaultModelRule,
          rules: modelRules.map(rule => ({
            _id: rule._id,
            name: rule.name,
            template: rule.template,
            isDefault: rule.isDefault,
            isActive: rule.isActive
          }))
        }
      }
    })

  } catch (error) {
    console.error('检查配置数据状态失败:', error)
    return NextResponse.json(
      { error: '检查配置数据状态失败', details: error.message },
      { status: 500 }
    )
  }
}
