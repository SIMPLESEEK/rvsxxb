import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { ProductModel } from '@/lib/models/Product'
import { ProductVariantModel } from '@/lib/models/ProductVariant'
import { ProjectListSaveModel } from '@/lib/models/ProjectListSave'

export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    // 获取各种数据的统计
    const [
      productsCount,
      productVariantsCount,
      projectListSavesCount
    ] = await Promise.all([
      ProductModel.count(),
      ProductVariantModel.count(),
      ProjectListSaveModel.count()
    ])

    return NextResponse.json({
      success: true,
      stats: {
        products: productsCount,
        baseProducts: 0, // 暂时设为0，因为BaseProduct模型不存在
        productVariants: productVariantsCount,
        projectListSaves: projectListSavesCount
      }
    })

  } catch (error) {
    console.error('获取数据统计失败:', error)
    return NextResponse.json(
      { error: '获取数据统计失败' },
      { status: 500 }
    )
  }
}
