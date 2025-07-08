import { NextRequest, NextResponse } from 'next/server'
import { ProductModel } from '@/lib/models/Product'
import { ColumnConfigModel } from '@/lib/models/ColumnConfig'
import { getVisibleColumns, filterProductData } from '@/lib/permissions'
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
    // 获取用户信息
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 获取所有产品
    const products = await ProductModel.findAll()
    console.log(`找到 ${products.length} 个产品`)

    // 获取所有列配置（包括不可见但重要的数据字段）
    const allColumns = await ColumnConfigModel.findAll()
    console.log(`找到 ${allColumns.length} 个列配置`)

    const visibleColumns = getVisibleColumns(user.role, allColumns)
    console.log(`用户 ${user.role} 可见列数: ${visibleColumns.length}`)

    // 根据用户角色过滤产品数据
    const filteredProducts = products.map(product =>
      filterProductData(user.role, product, visibleColumns)
    )

    console.log(`过滤后的产品数据示例:`, filteredProducts[0])

    return NextResponse.json({
      products: filteredProducts,
      columns: visibleColumns
    })

  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: '获取产品列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取用户信息
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const productData = await request.json()

    // 验证必填字段
    if (!productData.productType || !productData.name || !productData.model) {
      return NextResponse.json(
        { error: '产品类型、名称和型号不能为空' },
        { status: 400 }
      )
    }

    // 设置默认值
    const product = await ProductModel.create({
      ...productData,
      isActive: true,
      isFeatured: false,
      order: productData.order || 999
    })

    return NextResponse.json({
      message: '产品创建成功',
      product
    }, { status: 201 })

  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: '创建产品失败' },
      { status: 500 }
    )
  }
}
