import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '../../../lib/models/Product';
import { Product } from '@/types/product';

export async function GET(request: NextRequest) {
  try {
    console.log('测试产品API被调用');
    
    // 获取所有产品
    const products = await ProductModel.findAll();
    console.log(`找到 ${products.length} 个产品`);
    
    // 转换为简单格式
    const simpleProducts = products.map((product: Product) => ({
      _id: product._id,
      name: product.name,
      image: product.images?.display || '',
      createdAt: product.createdAt
    }));
    
    return NextResponse.json({
      success: true,
      count: products.length,
      products: simpleProducts
    });
    
  } catch (error) {
    console.error('测试产品API错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取产品失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
