import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '../../../../lib/models/Product';
import { Product } from '@/types/product';
import { ObjectId } from 'mongodb';

// 记录API访问日志
function logApiAccess(method: string, path: string, ip?: string) {
  console.log(`[External API] ${method} ${path} - IP: ${ip || 'unknown'}`);
}

// 查询所有产品
export async function GET(request: NextRequest) {
  try {
    // 记录API访问
    logApiAccess('GET', '/api/external/products', request.headers.get('x-forwarded-for') || undefined);
    
    // 获取URL参数
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const productType = searchParams.get('type');
    
    // 限制最大请求数量
    const finalLimit = Math.min(limit, 50);
    const skip = (page - 1) * finalLimit;
    
    // 获取所有产品
    const allProducts = await ProductModel.findAll();

    // 转换为API响应格式
    const convertedProducts = allProducts.map((product: Product) => {
      return {
        _id: product._id,
        name: product.name,
        description: product.specifications?.detailed || '',
        displayImage: {
          url: product.images?.display || ''
        },
        productType: product.productType,
        brand: product.brand,
        model: product.model,
        specification: product.specifications?.detailed || '',
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        order: product.order,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });
    
    // 应用分页
    const total = convertedProducts.length;
    const products = convertedProducts.slice(skip, skip + finalLimit);
    
    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit: finalLimit,
        totalPages: Math.ceil(total / finalLimit)
      }
    });
  } catch (error) {
    console.error('获取产品列表错误:', error);
    return NextResponse.json({ error: '获取产品列表失败' }, { status: 500 });
  }
}

// 不提供POST、PUT、DELETE方法，确保API只读
export async function POST() {
  return NextResponse.json(
    { error: '不支持的操作：此API仅提供只读访问' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: '不支持的操作：此API仅提供只读访问' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: '不支持的操作：此API仅提供只读访问' },
    { status: 405 }
  );
}
