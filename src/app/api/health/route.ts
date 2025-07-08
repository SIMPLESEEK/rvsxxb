import { NextResponse } from 'next/server'
import clientPromise, { getConnectionStats } from '@/lib/mongodb'

export async function GET() {
  try {
    // 检查MongoDB连接
    const startTime = Date.now()
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    // 执行简单的ping操作
    await db.admin().ping()
    const dbResponseTime = Date.now() - startTime

    // 获取连接统计信息
    const connectionStats = getConnectionStats()

    // 检查数据库集合状态
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`,
        database: process.env.MONGODB_DB,
        collections: collectionNames,
        connectionStats: {
          totalConnections: connectionStats.connectionCount,
          lastConnectionTime: new Date(connectionStats.lastConnectionTime).toISOString(),
          timeSinceLastConnection: `${Math.round(connectionStats.timeSinceLastConnection / 1000)}s`
        }
      },
      vercel: {
        region: process.env.VERCEL_REGION || 'unknown',
        deployment: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected'
        }
      },
      { status: 500 }
    )
  }
}
