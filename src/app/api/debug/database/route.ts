import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    // 连接到MongoDB
    client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    
    // 获取数据库列表
    const admin = client.db().admin()
    const databases = await admin.listDatabases()
    
    const results = {
      connectionString: process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
      configuredDatabase: process.env.MONGODB_DB,
      availableDatabases: databases.databases.map(db => ({
        name: db.name,
        sizeOnDisk: db.sizeOnDisk
      })),
      databaseAnalysis: {}
    }
    
    // 检查每个相关数据库的内容
    const databasesToCheck = ['xxb', 'xxbaug', 'test']
    
    for (const dbName of databasesToCheck) {
      try {
        const db = client.db(dbName)
        const collections = await db.listCollections().toArray()
        
        const dbInfo: any = {
          exists: collections.length > 0,
          collections: []
        }
        
        for (const collection of collections) {
          const coll = db.collection(collection.name)
          const count = await coll.countDocuments()
          
          dbInfo.collections.push({
            name: collection.name,
            documentCount: count
          })
          
          // 如果是users集合，获取用户详情
          if (collection.name === 'users' && count > 0) {
            const users = await coll.find({}, { 
              projection: { password: 0 } 
            }).toArray()
            dbInfo.users = users
          }
          
          // 如果是products集合，获取产品数量和样本
          if (collection.name === 'products' && count > 0) {
            const sampleProducts = await coll.find({}).limit(3).toArray()
            dbInfo.productSamples = sampleProducts.map(p => ({
              _id: p._id,
              name: p.name || p.productData?.get?.('产品名称') || 'Unknown',
              type: p.productType || 'Unknown',
              hasProductData: !!p.productData
            }))
          }
        }
        
        results.databaseAnalysis[dbName] = dbInfo
      } catch (error) {
        results.databaseAnalysis[dbName] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
    
    return NextResponse.json(results, { status: 200 })
    
  } catch (error) {
    console.error('Database debug error:', error)
    return NextResponse.json(
      { 
        error: 'Database analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}
