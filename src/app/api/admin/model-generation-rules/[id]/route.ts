import { NextRequest, NextResponse } from 'next/server'
import { ModelGenerationRuleModel } from '@/lib/models/ModelGenerationRule'
import { getUserFromToken } from '@/lib/auth'

// 获取单个型号生成规则
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
    const rule = await ModelGenerationRuleModel.findById(id)
    
    if (!rule) {
      return NextResponse.json(
        { error: '型号生成规则不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ rule })

  } catch (error) {
    console.error('获取型号生成规则失败:', error)
    return NextResponse.json(
      { error: '获取型号生成规则失败' },
      { status: 500 }
    )
  }
}

// 更新型号生成规则
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const updateData = await request.json()

    // 验证模板格式（如果提供了模板）
    if (updateData.template) {
      const validation = ModelGenerationRuleModel.validateTemplate(updateData.template)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `模板格式错误: ${validation.errors.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const { id } = await params
    const rule = await ModelGenerationRuleModel.update(id, updateData)
    
    if (!rule) {
      return NextResponse.json(
        { error: '型号生成规则不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '型号生成规则更新成功',
      rule
    })

  } catch (error) {
    console.error('更新型号生成规则失败:', error)
    return NextResponse.json(
      { error: '更新型号生成规则失败' },
      { status: 500 }
    )
  }
}

// 删除型号生成规则
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { id } = await params
    const success = await ModelGenerationRuleModel.delete(id)
    
    if (!success) {
      return NextResponse.json(
        { error: '型号生成规则不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '型号生成规则删除成功'
    })

  } catch (error) {
    console.error('删除型号生成规则失败:', error)
    return NextResponse.json(
      { error: '删除型号生成规则失败' },
      { status: 500 }
    )
  }
}
