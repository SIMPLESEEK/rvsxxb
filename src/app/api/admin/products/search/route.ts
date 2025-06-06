import { NextRequest, NextResponse } from 'next/server'
import { ProductModel } from '@/lib/models/Product'
import { getUserFromToken } from '@/lib/auth'

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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      )
    }

    // 获取所有产品并进行搜索
    const allProducts = await ProductModel.findAll()
    
    const filteredProducts = allProducts.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.model.toLowerCase().includes(query.toLowerCase()) ||
      product.productType.toLowerCase().includes(query.toLowerCase()) ||
      product._id?.toString() === query
    )

    return NextResponse.json({
      products: filteredProducts,
      count: filteredProducts.length
    })

  } catch (error) {
    console.error('Search products error:', error)
    return NextResponse.json(
      { error: '搜索产品失败' },
      { status: 500 }
    )
  }
}
