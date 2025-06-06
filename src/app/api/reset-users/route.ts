import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '../../../lib/models/User'
import clientPromise from '../../../lib/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 开始重置用户数据...')
    
    // 连接数据库
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB) // 使用xxb数据库
    const usersCollection = db.collection('users')
    
    // 1. 删除所有现有用户
    console.log('🗑️ 删除所有现有用户...')
    const deleteResult = await usersCollection.deleteMany({})
    console.log(`✅ 已删除 ${deleteResult.deletedCount} 个用户`)
    
    // 2. 创建新的标准用户
    const standardUsers = [
      {
        username: 'admin',
        email: 'admin@xxbaug.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'dealer',
        email: 'dealer@xxbaug.com',
        password: 'dealer123',
        role: 'dealer'
      },
      {
        username: 'user',
        email: 'user@xxbaug.com',
        password: 'user123',
        role: 'user'
      }
    ]
    
    console.log('👥 创建标准用户...')
    const createdUsers = []
    
    for (const userData of standardUsers) {
      // 加密密码
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      
      // 创建用户对象
      const user = {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // 插入用户
      const result = await usersCollection.insertOne(user)
      
      createdUsers.push({
        id: result.insertedId,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        password: userData.password // 明文密码用于返回
      })
      
      console.log(`✅ 创建用户: ${userData.username} (${userData.role})`)
    }
    
    console.log('🎉 用户重置完成!')
    
    return NextResponse.json({
      success: true,
      message: '用户数据重置完成',
      deletedCount: deleteResult.deletedCount,
      createdUsers: createdUsers,
      loginInfo: {
        admin: { username: 'admin', password: 'admin123', role: 'admin' },
        dealer: { username: 'dealer', password: 'dealer123', role: 'dealer' },
        user: { username: 'user', password: 'user123', role: 'user' }
      }
    })
    
  } catch (error) {
    console.error('❌ 用户重置失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '用户重置失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
