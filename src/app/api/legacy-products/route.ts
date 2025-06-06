import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

// 连接到MongoDB并获取xxbws格式的产品数据
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    // 连接到MongoDB
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    
    const db = client.db()
    const productsCollection = db.collection('products')
    
    // 获取所有产品数据
    const legacyProducts = await productsCollection.find({}).toArray()
    
    // 转换数据格式：从xxbws的Map格式转换为xxbaug的结构化格式
    const convertedProducts = legacyProducts.map(product => {
      const productData = product.productData || new Map()
      
      // 将Map转换为普通对象（如果需要）
      const data = productData instanceof Map ? Object.fromEntries(productData) : productData
      
      return {
        _id: product._id,
        // 基本信息
        name: data['产品名称'] || data['name'] || '',
        description: data['产品描述'] || data['description'] || '',
        specification: data['详细规格'] || data['specification'] || '',
        
        // 产品类型（需要映射）
        productType: data['产品类型'] || data['productType'] || '',
        
        // 品牌
        brand: data['品牌'] || data['brand'] || '',
        
        // 型号
        model: data['型号'] || data['model'] || '',
        
        // 图片信息
        displayImage: {
          url: data['产品图片'] || data['displayImage'] || '',
          cosStoragePath: ''
        },
        
        // 规格信息
        specifications: {
          detailed: data['详细规格'] || data['detailed_spec'] || '',
          brief: data['简要规格'] || data['brief_spec'] || ''
        },
        
        // 外观信息
        appearance: {
          color: data['颜色'] || data['color'] || '',
          installation: data['安装方式'] || data['installation'] || '',
          cutoutSize: data['开孔尺寸'] || data['cutout_size'] || ''
        },
        
        // 控制方式
        control: data['控制方式'] || data['control'] || '',
        
        // 备注
        notes: data['备注'] || data['notes'] || '',
        
        // 价格信息（如果有）
        pricing: data['单价'] || data['交期'] ? {
          unitPrice: parseFloat(data['单价'] || '0') || 0,
          deliveryTime: data['交期'] || ''
        } : undefined,
        
        // 状态
        isActive: true,
        isFeatured: false,
        order: 999,
        
        // 时间戳
        createdAt: product.createdAt || new Date(),
        updatedAt: product.updatedAt || new Date(),
        
        // 原始数据（用于调试）
        _originalData: data
      }
    })
    
    return NextResponse.json({
      success: true,
      count: convertedProducts.length,
      products: convertedProducts
    })
    
  } catch (error) {
    console.error('获取legacy产品数据失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取产品数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}
