import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

// 数据迁移API：将xxbws格式的数据转换为xxbaug格式
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    // 连接到MongoDB获取原始数据
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    
    const db = client.db()
    const productsCollection = db.collection('products')
    
    // 获取所有xxbws格式的产品数据
    const legacyProducts = await productsCollection.find({}).toArray()
    console.log(`找到 ${legacyProducts.length} 个legacy产品`)
    
    if (legacyProducts.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有找到需要迁移的数据'
      })
    }
    
    // 清空现有产品数据（使用products集合，覆盖原有数据）
    const xxbaugDb = client.db()
    await xxbaugDb.collection('products').deleteMany({})
    console.log('已清空现有产品数据')
    
    // 转换并插入数据
    const convertedProducts = []
    
    for (const legacyProduct of legacyProducts) {
      try {
        const productData = legacyProduct.productData || new Map()
        
        // 将Map转换为普通对象
        const data = productData instanceof Map ? Object.fromEntries(productData) : productData
        
        // 转换为xxbaug格式
        const converted = {
          name: data['产品名称'] || data['name'] || '未命名产品',
          description: data['产品描述'] || data['description'] || '',
          specification: data['详细规格'] || data['specification'] || '',
          
          // 处理图片
          displayImage: {
            url: data['产品图片'] || data['displayImage'] || '',
            cosStoragePath: '',
            filename: '',
            size: 0,
            mimeType: 'image/jpeg'
          },
          
          // 空的文件数组
          introImages: [],
          specFiles: [],
          cadFiles: [],
          iesFiles: [],
          
          // 标签（空对象）
          tags: {},
          
          // 状态
          isActive: true,
          isFeatured: false,
          order: 999,
          
          // 保留原始时间戳
          createdAt: legacyProduct.createdAt || new Date(),
          updatedAt: legacyProduct.updatedAt || new Date()
        }
        
        convertedProducts.push(converted)
        
      } catch (error) {
        console.error(`转换产品失败 (ID: ${legacyProduct._id}):`, error)
      }
    }
    
    if (convertedProducts.length > 0) {
      console.log(`插入 ${convertedProducts.length} 个转换后的产品...`)
      await xxbaugDb.collection('products').insertMany(convertedProducts)
      console.log('数据迁移完成！')
    }

    // 验证迁移结果
    const newCount = await xxbaugDb.collection('products').countDocuments()
    
    return NextResponse.json({
      success: true,
      message: '数据迁移完成',
      originalCount: legacyProducts.length,
      convertedCount: convertedProducts.length,
      finalCount: newCount
    })
    
  } catch (error) {
    console.error('数据迁移失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '数据迁移失败',
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
