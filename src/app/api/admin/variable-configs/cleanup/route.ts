import { NextResponse } from 'next/server'
import { VariableConfigModel } from '@/lib/models/VariableConfig'
import { VariableType } from '@/types/product'

// 允许的变量类型
const ALLOWED_TYPES: VariableType[] = ['colorTemperature', 'beamAngle', 'appearanceColor', 'controlMethod']

export async function POST() {
  try {
    // 获取所有变量配置
    const allConfigs = await VariableConfigModel.findAll()
    
    // 找出需要删除的配置
    const configsToDelete = allConfigs.filter(config => 
      !ALLOWED_TYPES.includes(config.type as VariableType)
    )
    
    console.log('需要删除的变量配置:', configsToDelete.map(c => ({ type: c.type, label: c.label })))
    
    // 删除额外的配置
    let deletedCount = 0
    for (const config of configsToDelete) {
      if (config._id) {
        const success = await VariableConfigModel.delete(config._id.toString())
        if (success) {
          deletedCount++
          console.log(`已删除变量配置: ${config.type} - ${config.label}`)
        }
      }
    }
    
    // 获取剩余的配置
    const remainingConfigs = await VariableConfigModel.findAll()
    
    return NextResponse.json({
      message: '变量配置清理完成',
      deletedCount,
      remainingConfigs: remainingConfigs.map(c => ({ type: c.type, label: c.label, isActive: c.isActive }))
    })
    
  } catch (error) {
    console.error('清理变量配置失败:', error)
    return NextResponse.json(
      { error: '清理变量配置失败' },
      { status: 500 }
    )
  }
}
