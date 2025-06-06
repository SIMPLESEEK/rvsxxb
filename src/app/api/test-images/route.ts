import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 测试图片URL
    const testUrls = [
      'https://xxb-1301676052.cos.ap-guangzhou.myqcloud.com/xxb/1749044584630-n4ecyi.jpg',
      'https://xxb-1301676052.cos.ap-guangzhou.myqcloud.com/xxb/1749044587964-adpi59.png',
      'https://xxb-1301676052.cos.ap-guangzhou.myqcloud.com/xxb/1749044838033-08058p.jpg',
      'https://invalid-url.com/nonexistent.jpg' // 无效URL用于测试
    ]

    const results = []

    for (const url of testUrls) {
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5秒超时
        })
        
        results.push({
          url,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          isValid: response.ok
        })
      } catch (error) {
        results.push({
          url,
          status: 0,
          statusText: 'Network Error',
          contentType: null,
          contentLength: null,
          isValid: false,
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        valid: results.filter(r => r.isValid).length,
        invalid: results.filter(r => !r.isValid).length
      }
    })

  } catch (error) {
    console.error('测试图片URL失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '测试失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
