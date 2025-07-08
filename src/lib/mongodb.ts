import { MongoClient, MongoClientOptions } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI

// 针对免费MongoDB Atlas和Vercel的连接池优化配置
const options: MongoClientOptions = {
  // 连接池设置 - 针对免费账户优化
  maxPoolSize: 10, // 最大连接数（免费Atlas限制500个连接）
  minPoolSize: 2,  // 最小连接数
  maxIdleTimeMS: 60000, // 连接空闲60秒后关闭
  serverSelectionTimeoutMS: 5000, // 服务器选择超时5秒
  socketTimeoutMS: 45000, // Socket超时45秒

  // 连接管理
  connectTimeoutMS: 10000, // 连接超时10秒
  heartbeatFrequencyMS: 10000, // 心跳检测频率10秒

  // 重试设置
  retryWrites: true,
  retryReads: true,

  // 压缩设置（减少网络传输）
  compressors: ['snappy', 'zlib'],

  // 应用名称（便于MongoDB Atlas监控）
  appName: 'xxbaug-v3'
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// 连接状态监控
let connectionCount = 0
let lastConnectionTime = 0

// 创建连接的包装函数，添加监控
async function createConnection(): Promise<MongoClient> {
  try {
    connectionCount++
    lastConnectionTime = Date.now()

    console.log(`[MongoDB] 创建新连接 #${connectionCount} at ${new Date().toISOString()}`)

    const mongoClient = new MongoClient(uri, options)
    const connectedClient = await mongoClient.connect()

    // 监听连接事件
    connectedClient.on('connectionPoolCreated', () => {
      console.log('[MongoDB] 连接池已创建')
    })

    connectedClient.on('connectionPoolClosed', () => {
      console.log('[MongoDB] 连接池已关闭')
    })

    connectedClient.on('connectionCreated', () => {
      console.log('[MongoDB] 新连接已建立')
    })

    connectedClient.on('connectionClosed', () => {
      console.log('[MongoDB] 连接已关闭')
    })

    // 在Vercel环境中，设置定期清理空闲连接
    if (process.env.VERCEL) {
      setInterval(() => {
        const now = Date.now()
        if (now - lastConnectionTime > 60000) { // 60秒无活动
          console.log('[MongoDB] 清理空闲连接')
          // 注意：不要直接关闭client，让连接池自动管理
        }
      }, 30000) // 每30秒检查一次
    }

    return connectedClient
  } catch (error) {
    console.error('[MongoDB] 连接失败:', error)
    throw error
  }
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
    _mongoConnectionCount?: number
  }

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = createConnection()
    globalWithMongo._mongoConnectionCount = 0
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = createConnection()
}

// 导出连接状态监控函数
export const getConnectionStats = () => ({
  connectionCount,
  lastConnectionTime,
  timeSinceLastConnection: Date.now() - lastConnectionTime
})

// 优雅关闭函数（用于Vercel函数结束时）
export const closeConnection = async () => {
  try {
    const mongoClient = await clientPromise
    await mongoClient.close()
    console.log('[MongoDB] 连接已优雅关闭')
  } catch (error) {
    console.error('[MongoDB] 关闭连接时出错:', error)
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
