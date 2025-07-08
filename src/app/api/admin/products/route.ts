import { NextRequest, NextResponse } from 'next/server'
import { ProductModel } from '@/lib/models/Product'
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

    const products = await ProductModel.findAll()

    return NextResponse.json({
      products
    })

  } catch (error) {
    console.error('Get admin products error:', error)
    return NextResponse.json(
      { error: '获取产品列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const productData = await request.json()
    console.log('接收到的产品数据:', productData)

    // 验证必填字段
    if (!productData.productType || !productData.model) {
      console.log('验证失败 - 必填字段缺失:', {
        productType: productData.productType,
        model: productData.model
      })
      return NextResponse.json(
        { error: '产品类型和型号不能为空' },
        { status: 400 }
      )
    }

    // 创建产品数据，支持动态字段
    const productToCreate: any = {
      productType: productData.productType,
      brand: productData.brand || '',
      model: productData.model,
      modelLink: productData.modelLink || '', // 新增：产品型号链接
      images: {
        display: productData.images?.display || '',
        dimension: productData.images?.dimension || '',
        accessories: productData.images?.accessories || ''
      },
      specifications: {
        detailed: productData.specifications?.detailed || '',
        brief: productData.specifications?.brief || ''
      },
      appearance: {
        color: productData.appearance?.color || '',
        installation: productData.appearance?.installation || '',
        cutoutSize: productData.appearance?.cutoutSize || ''
      },
      control: productData.control || '',
      notes: productData.notes || '',
      pricing: productData.pricing ? {
        unitPrice: productData.pricing.unitPrice || 0,
        deliveryTime: productData.pricing.deliveryTime || ''
      } : undefined,
      isActive: productData.isActive !== false,
      isNew: productData.isNew || false,
      order: productData.order || 999,
      // 新增：产品变量选择
      productVariables: productData.productVariables || {}
    }

    // 添加其他动态字段
    Object.keys(productData).forEach(key => {
      if (!['productType', 'brand', 'model', 'images', 'specifications', 'appearance', 'control', 'notes', 'pricing', 'isActive', 'isNew', 'order'].includes(key)) {
        productToCreate[key] = productData[key]
      }
    })

    const product = await ProductModel.create(productToCreate)

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

    const { id, ...productData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: '产品ID不能为空' },
        { status: 400 }
      )
    }

    const success = await ProductModel.update(id, productData)

    if (!success) {
      return NextResponse.json(
        { error: '产品不存在或更新失败' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '产品更新成功'
    })

  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: '更新产品失败' },
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
        { error: '产品ID不能为空' },
        { status: 400 }
      )
    }

    const success = await ProductModel.delete(id)

    if (!success) {
      return NextResponse.json(
        { error: '产品不存在或删除失败' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '产品删除成功'
    })

  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: '删除产品失败' },
      { status: 500 }
    )
  }
}
