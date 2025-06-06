import { NextRequest, NextResponse } from 'next/server'
import { ProductModel } from '@/lib/models/Product'

export async function GET(request: NextRequest) {
  try {
    // 获取前3个产品的详细信息
    const products = await ProductModel.findAll()
    
    // 调试信息 - 只取前3个
    const debugInfo = products.slice(0, 3).map(product => ({
      _id: product._id,
      name: product.name,
      images: product.images,
      imagesDisplay: product.images?.display,
      imagesDimension: product.images?.dimension,
      imagesAccessories: product.images?.accessories,
      rawProduct: product
    }))
    
    return NextResponse.json({
      message: '产品调试信息',
      count: products.length,
      debugInfo
    })
    
  } catch (error) {
    console.error('Debug products error:', error)
    return NextResponse.json(
      { error: '获取调试信息失败' },
      { status: 500 }
    )
  }
}
