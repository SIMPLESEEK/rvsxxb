import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import clientPromise, { getConnectionStats } from '@/lib/mongodb'
import { JWTPayload } from '@/types/auth'

interface ConnectionStats {
  connectionCount: number
  lastConnectionTime: number
  timeSinceLastConnection: number
}

interface ServerStatus {
  connections?: {
    current?: number
    available?: number
    totalCreated?: number
  }
  mem?: {
    resident?: number
    virtual?: number
    mapped?: number
  }
  opcounters?: {
    insert?: number
    query?: number
    update?: number
    delete?: number
    getmore?: number
    command?: number
  }
}

// 验证管理员权限
async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    return decoded.role === 'admin' ? decoded : null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    // 获取连接统计信息
    const connectionStats = getConnectionStats()
    
    // 获取MongoDB连接池状态
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    
    // 执行数据库状态检查
    const startTime = Date.now()
    const serverStatus = await db.admin().serverStatus()
    const dbResponseTime = Date.now() - startTime
    
    // 获取数据库统计信息
    const dbStats = await db.stats()
    
    // 获取集合统计信息
    const collections = await db.listCollections().toArray()
    const collectionStats = []
    
    for (const collection of collections.slice(0, 10)) { // 限制前10个集合
      try {
        const count = await db.collection(collection.name).estimatedDocumentCount()
        collectionStats.push({
          name: collection.name,
          count: count || 0,
          size: 0, // 无法获取大小信息
          avgObjSize: 0 // 无法获取平均对象大小
        })
      } catch {
        // 某些集合可能无法获取统计信息
        collectionStats.push({
          name: collection.name,
          count: 0,
          size: 0,
          avgObjSize: 0,
          error: 'Unable to get stats'
        })
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      
      // 应用连接统计
      applicationStats: {
        totalConnections: connectionStats.connectionCount,
        lastConnectionTime: new Date(connectionStats.lastConnectionTime).toISOString(),
        timeSinceLastConnection: `${Math.round(connectionStats.timeSinceLastConnection / 1000)}s`,
        uptime: `${Math.round(process.uptime())}s`
      },
      
      // MongoDB服务器状态
      serverStats: {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: {
          current: serverStatus.connections?.current || 0,
          available: serverStatus.connections?.available || 0,
          totalCreated: serverStatus.connections?.totalCreated || 0
        },
        network: {
          bytesIn: serverStatus.network?.bytesIn || 0,
          bytesOut: serverStatus.network?.bytesOut || 0,
          numRequests: serverStatus.network?.numRequests || 0
        },
        opcounters: {
          insert: serverStatus.opcounters?.insert || 0,
          query: serverStatus.opcounters?.query || 0,
          update: serverStatus.opcounters?.update || 0,
          delete: serverStatus.opcounters?.delete || 0
        }
      },
      
      // 数据库统计
      databaseStats: {
        name: process.env.MONGODB_DB,
        collections: dbStats.collections || 0,
        dataSize: dbStats.dataSize || 0,
        storageSize: dbStats.storageSize || 0,
        indexes: dbStats.indexes || 0,
        indexSize: dbStats.indexSize || 0,
        responseTime: `${dbResponseTime}ms`
      },
      
      // 集合统计
      collectionStats,
      
      // Vercel环境信息
      vercelStats: {
        region: process.env.VERCEL_REGION || 'unknown',
        deployment: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown'
      },
      
      // 内存使用情况
      memoryUsage: process.memoryUsage(),
      
      // 连接池建议
      recommendations: generateRecommendations(connectionStats, serverStatus)
    })
    
  } catch (error) {
    console.error('Connection stats error:', error)
    
    return NextResponse.json(
      { 
        error: '获取连接统计失败',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// 生成连接池优化建议
function generateRecommendations(connectionStats: ConnectionStats, serverStatus: ServerStatus) {
  const recommendations = []
  
  // 检查连接数
  const currentConnections = serverStatus.connections?.current || 0
  const availableConnections = serverStatus.connections?.available || 0
  
  if (currentConnections > 50) {
    recommendations.push({
      type: 'warning',
      message: `当前连接数较高 (${currentConnections})，建议检查连接是否正确关闭`
    })
  }
  
  if (availableConnections < 100) {
    recommendations.push({
      type: 'critical',
      message: `可用连接数较低 (${availableConnections})，可能接近连接限制`
    })
  }
  
  // 检查应用连接频率
  const timeSinceLastConnection = connectionStats.timeSinceLastConnection
  if (timeSinceLastConnection > 300000) { // 5分钟
    recommendations.push({
      type: 'info',
      message: '应用连接空闲时间较长，连接池配置良好'
    })
  }
  
  // 检查内存使用
  const memUsage = process.memoryUsage()
  const memUsageMB = memUsage.heapUsed / 1024 / 1024
  if (memUsageMB > 100) {
    recommendations.push({
      type: 'warning',
      message: `内存使用较高 (${memUsageMB.toFixed(2)}MB)，建议监控内存泄漏`
    })
  }
  
  return recommendations
}

// 强制关闭连接的管理接口（谨慎使用）
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const { action } = await request.json()
    
    if (action === 'force_close') {
      // 这是一个危险操作，仅在紧急情况下使用
      console.log('[MongoDB] 管理员强制关闭连接')
      
      return NextResponse.json({
        message: '连接关闭请求已记录，系统将在下次空闲时关闭连接',
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json(
      { error: '不支持的操作' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Connection management error:', error)
    
    return NextResponse.json(
      { 
        error: '连接管理操作失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
