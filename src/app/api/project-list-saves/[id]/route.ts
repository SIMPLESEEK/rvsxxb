import { NextRequest, NextResponse } from 'next/server'
import { ProjectListSaveModel } from '@/lib/models/ProjectListSave'
import jwt from 'jsonwebtoken'

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

// 获取单个暂存
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
    const save = await ProjectListSaveModel.findById(id)
    
    if (!save) {
      return NextResponse.json(
        { error: '暂存不存在' },
        { status: 404 }
      )
    }

    // 确保只能访问自己的暂存
    if (save.userId !== user.userId) {
      return NextResponse.json(
        { error: '无权访问此暂存' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      save
    })

  } catch (error) {
    console.error('Get project list save error:', error)
    return NextResponse.json(
      { error: '获取暂存失败' },
      { status: 500 }
    )
  }
}

// 删除暂存
export async function DELETE(
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
    const success = await ProjectListSaveModel.delete(id, user.userId)
    
    if (!success) {
      return NextResponse.json(
        { error: '删除失败，暂存不存在或无权删除' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '暂存删除成功'
    })

  } catch (error) {
    console.error('Delete project list save error:', error)
    return NextResponse.json(
      { error: '删除暂存失败' },
      { status: 500 }
    )
  }
}
