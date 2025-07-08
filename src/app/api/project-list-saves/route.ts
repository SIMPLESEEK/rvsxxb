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

// 获取用户的所有暂存
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const saves = await ProjectListSaveModel.findByUserId(user.userId)

    return NextResponse.json({
      saves
    })

  } catch (error) {
    console.error('Get project list saves error:', error)
    return NextResponse.json(
      { error: '获取暂存列表失败' },
      { status: 500 }
    )
  }
}

// 创建新的暂存
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { 
      name,
      projectList, 
      customerInfo, 
      quotationNotes, 
      quotationNumber,
      projectFields 
    } = await request.json()

    // 验证必填字段
    if (!name || !projectList) {
      return NextResponse.json(
        { error: '暂存名称和项目清单不能为空' },
        { status: 400 }
      )
    }

    // 检查用户暂存数量限制（最多5个）
    const existingSaves = await ProjectListSaveModel.findByUserId(user.userId)
    if (existingSaves.length >= 5) {
      return NextResponse.json(
        { error: '暂存已满（5/5）\n\n请点击"导入"按钮删除不需要的暂存项目' },
        { status: 400 }
      )
    }

    const saveData = {
      userId: user.userId,
      name,
      projectList,
      customerInfo: customerInfo || {
        name: '',
        projectName: '',
        contact: '',
        phone: '',
        email: ''
      },
      quotationNotes: quotationNotes || '',
      quotationNumber: quotationNumber || '',
      projectFields: projectFields || {}
    }

    const projectSave = await ProjectListSaveModel.create(saveData)

    return NextResponse.json({
      message: '项目清单暂存成功',
      save: projectSave
    })

  } catch (error) {
    console.error('Save project list error:', error)
    return NextResponse.json(
      { error: '暂存项目清单失败' },
      { status: 500 }
    )
  }
}
