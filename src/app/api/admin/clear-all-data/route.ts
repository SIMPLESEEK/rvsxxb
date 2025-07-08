import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { ProductModel } from '@/lib/models/Product'
import { ProductVariantModel } from '@/lib/models/ProductVariant'
import { ProjectListSaveModel } from '@/lib/models/ProjectListSave'

export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    console.log(`管理员 ${user.username} 开始清理所有产品数据`)

    // 获取清理前的统计数据
    const [
      productsCountBefore,
      productVariantsCountBefore,
      projectListSavesCountBefore
    ] = await Promise.all([
      ProductModel.count(),
      ProductVariantModel.count(),
      ProjectListSaveModel.count()
    ])

    console.log('清理前统计:', {
      products: productsCountBefore,
      baseProducts: 0, // BaseProduct模型不存在
      productVariants: productVariantsCountBefore,
      projectListSaves: projectListSavesCountBefore
    })

    // 执行清理操作
    const [
      deletedProducts,
      deletedProductVariants,
      deletedProjectListSaves
    ] = await Promise.all([
      ProductModel.deleteAll(),
      ProductVariantModel.deleteAll(),
      ProjectListSaveModel.deleteAll()
    ])

    console.log('清理完成，删除的记录数:', {
      products: deletedProducts,
      baseProducts: 0, // BaseProduct模型不存在
      productVariants: deletedProductVariants,
      projectListSaves: deletedProjectListSaves
    })

    return NextResponse.json({
      success: true,
      message: '所有产品数据已清理完成',
      deletedProducts,
      deletedBaseProducts: 0, // BaseProduct模型不存在
      deletedProductVariants,
      deletedProjectListSaves,
      beforeCounts: {
        products: productsCountBefore,
        baseProducts: 0, // BaseProduct模型不存在
        productVariants: productVariantsCountBefore,
        projectListSaves: projectListSavesCountBefore
      }
    })

  } catch (error) {
    console.error('清理数据失败:', error)
    return NextResponse.json(
      { error: '清理数据失败，请稍后重试' },
      { status: 500 }
    )
  }
}
