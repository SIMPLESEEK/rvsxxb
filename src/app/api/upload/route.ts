import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { uploadToCOS, deleteFromCOS, checkCOSConfig } from '@/lib/cos'

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

    if (!file) {
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '只能上传图片文件' },
        { status: 400 }
      )
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过5MB' },
        { status: 400 }
      )
    }

    // 上传到腾讯云COS的xxb文件夹
    const uploadResult = await uploadToCOS(file, 'xxb')

    return NextResponse.json({
      message: '文件上传成功',
      url: uploadResult.url,
      fileName: uploadResult.filename,
      cosStoragePath: uploadResult.cosStoragePath,
      size: uploadResult.size,
      type: uploadResult.mimeType
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '文件上传失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { fileUrl, cosStoragePath } = await request.json()

    if (!fileUrl && !cosStoragePath) {
      return NextResponse.json(
        { error: '文件URL或COS存储路径不能为空' },
        { status: 400 }
      )
    }

    // 如果提供了cosStoragePath，直接使用；否则从URL中提取
    let pathToDelete = cosStoragePath
    if (!pathToDelete && fileUrl) {
      // 从URL中提取COS存储路径
      const url = new URL(fileUrl)
      pathToDelete = url.pathname.substring(1) // 移除开头的'/'
    }

    if (!pathToDelete) {
      return NextResponse.json(
        { error: '无法确定文件存储路径' },
        { status: 400 }
      )
    }

    // 从腾讯云COS删除文件
    await deleteFromCOS(pathToDelete)

    return NextResponse.json({
      message: '文件删除成功'
    })

  } catch (error) {
    console.error('Delete file error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '文件删除失败' },
      { status: 500 }
    )
  }
}
