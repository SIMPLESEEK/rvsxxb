import { NextRequest, NextResponse } from 'next/server'
import { ColumnConfigModel } from '@/lib/models/ColumnConfig'
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

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const allColumns = await ColumnConfigModel.findAll()

    // 过滤掉不应该在管理界面中显示的系统内部字段
    const systemInternalFields = ['isActive', '_id', 'productVariables']
    const managableColumns = allColumns.filter(column =>
      !systemInternalFields.includes(column.key)
    )

    return NextResponse.json({
      columns: managableColumns
    })

  } catch (error) {
    console.error('Get columns error:', error)
    return NextResponse.json(
      { error: '获取列配置失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/columns - 开始处理请求')

    // 验证管理员权限
    const user = await getUserFromToken(request)
    console.log('用户认证结果:', user ? `用户: ${user.username}, 角色: ${user.role}` : '未认证')

    if (!user || user.role !== 'admin') {
      console.log('权限验证失败:', user ? `角色不匹配: ${user.role}` : '用户未认证')
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const columnData = await request.json()
    console.log('接收到的列配置数据:', columnData)

    // 验证必填字段
    if (!columnData.key || !columnData.label || !columnData.type) {
      console.log('必填字段验证失败:', {
        key: !!columnData.key,
        label: !!columnData.label,
        type: !!columnData.type
      })
      return NextResponse.json(
        { error: '字段名、标签和类型不能为空' },
        { status: 400 }
      )
    }

    // 检查字段名是否已存在
    const existingColumns = await ColumnConfigModel.findAll()
    const keyExists = existingColumns.some(col => col.key === columnData.key)
    if (keyExists) {
      console.log('字段名已存在:', columnData.key)
      return NextResponse.json(
        { error: '字段名已存在，请使用不同的字段名' },
        { status: 400 }
      )
    }

    console.log('开始创建列配置...')
    const column = await ColumnConfigModel.create({
      key: columnData.key,
      label: columnData.label,
      type: columnData.type,
      roles: columnData.roles || ['user', 'dealer', 'admin'],
      width: columnData.width || '',
      order: columnData.order || 999,
      isVisible: columnData.isVisible !== false
    })

    console.log('列配置创建成功:', column)
    return NextResponse.json({
      message: '列配置创建成功',
      column
    }, { status: 201 })

  } catch (error) {
    console.error('Create column error:', error)
    console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息')

    // 返回更详细的错误信息
    let errorMessage = '创建列配置失败'
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        errorMessage = '字段名已存在'
      } else if (error.message.includes('validation')) {
        errorMessage = '数据验证失败'
      } else if (error.message.includes('connection')) {
        errorMessage = '数据库连接失败'
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { id, ...columnData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: '列配置ID不能为空' },
        { status: 400 }
      )
    }

    const success = await ColumnConfigModel.update(id, columnData)

    if (!success) {
      return NextResponse.json(
        { error: '列配置不存在或更新失败' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '列配置更新成功'
    })

  } catch (error) {
    console.error('Update column error:', error)
    return NextResponse.json(
      { error: '更新列配置失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '列配置ID不能为空' },
        { status: 400 }
      )
    }

    const success = await ColumnConfigModel.delete(id)

    if (!success) {
      return NextResponse.json(
        { error: '列配置不存在或删除失败' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '列配置删除成功'
    })

  } catch (error) {
    console.error('Delete column error:', error)
    return NextResponse.json(
      { error: '删除列配置失败' },
      { status: 500 }
    )
  }
}
