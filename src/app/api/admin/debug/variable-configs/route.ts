import { NextRequest, NextResponse } from 'next/server'
import { VariableConfigModel } from '@/lib/models/VariableConfig'
import { getUserFromToken } from '@/lib/auth'

// 重置变量配置为默认配置（调试用）
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 清空现有配置并重新初始化默认配置
    await VariableConfigModel.clearAll()
    await VariableConfigModel.initializeDefaultConfigs()

    const configs = await VariableConfigModel.findAll()

    return NextResponse.json({
      message: '变量配置已重置为默认配置',
      configs,
      total: configs.length
    })

  } catch (error) {
    console.error('重置变量配置失败:', error)
    return NextResponse.json(
      { error: '重置变量配置失败' },
      { status: 500 }
    )
  }
}
