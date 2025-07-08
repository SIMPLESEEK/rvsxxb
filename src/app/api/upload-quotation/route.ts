import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { uploadToCOS, checkCOSConfig } from '@/lib/cos'

async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    // 检查COS配置
    if (!checkCOSConfig()) {
      return NextResponse.json(
        { error: 'COS配置不完整，请检查环境变量' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const quotationNumber = formData.get('quotationNumber') as string

    if (!file) {
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      )
    }

    // 验证文件类型 - 允许PDF和Excel文件
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ]

    if (!allowedTypes.some(type => file.type.includes(type))) {
      return NextResponse.json(
        { error: '只能上传PDF或Excel文件' },
        { status: 400 }
      )
    }

    // 验证文件大小 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过20MB' },
        { status: 400 }
      )
    }

    // 生成文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)

    // 根据文件类型确定扩展名
    let extension = '.pdf'
    if (file.type.includes('spreadsheetml.sheet')) {
      extension = '.xlsx'
    } else if (file.type.includes('ms-excel')) {
      extension = '.xls'
    }

    const filename = quotationNumber
      ? `${quotationNumber}_${timestamp}${extension}`
      : `quotation_${timestamp}_${randomStr}${extension}`

    // 上传到腾讯云COS的quotations文件夹
    const uploadResult = await uploadToCOS(file, 'quotations', filename)

    return NextResponse.json({
      message: '报价单上传成功',
      url: uploadResult.url,
      fileName: uploadResult.filename,
      cosStoragePath: uploadResult.cosStoragePath,
      size: uploadResult.size,
      type: uploadResult.mimeType,
      quotationNumber: quotationNumber || null
    })

  } catch (error) {
    console.error('Upload quotation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '报价单上传失败' },
      { status: 500 }
    )
  }
}
