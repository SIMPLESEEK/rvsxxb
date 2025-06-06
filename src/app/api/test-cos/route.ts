import { NextRequest, NextResponse } from 'next/server'
import { checkCOSConfig } from '@/lib/cos'

export async function GET(request: NextRequest) {
  try {
    const config = {
      COS_SECRET_ID: process.env.COS_SECRET_ID ? '已设置' : '未设置',
      COS_SECRET_KEY: process.env.COS_SECRET_KEY ? '已设置' : '未设置',
      COS_REGION: process.env.COS_REGION,
      COS_BUCKET: process.env.COS_BUCKET,
      configCheck: checkCOSConfig()
    }
    
    return NextResponse.json({
      success: true,
      config
    })
    
  } catch (error) {
    console.error('测试COS配置失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '测试COS配置失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
