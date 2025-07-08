import clientPromise from '../mongodb'
import { User, UserRole } from '@/types/auth'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'

export class UserModel {
  private static async getCollection() {
    const client = await clientPromise
    // 使用环境变量中配置的数据库
    const db = client.db(process.env.MONGODB_DB)
    return db.collection<User>('users')
  }

  static async findByUsername(username: string): Promise<User | null> {
    const collection = await this.getCollection()
    // 使用正则表达式进行不区分大小写的查找
    return await collection.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })
  }

  static async findByEmail(email: string): Promise<User | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ email })
  }

  static async findById(id: string): Promise<User | null> {
    const collection = await this.getCollection()
    const { ObjectId } = require('mongodb')
    return await collection.findOne({ _id: new ObjectId(id) })
  }

  static async create(userData: {
    username: string
    email: string
    password: string
    role?: UserRole
  }): Promise<User> {
    const collection = await this.getCollection()
    
    // 检查用户名是否已存在
    const existingUser = await this.findByUsername(userData.username)
    if (existingUser) {
      throw new Error('用户名已存在')
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.findByEmail(userData.email)
    if (existingEmail) {
      throw new Error('邮箱已存在')
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    const user: Omit<User, '_id'> = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(user)
    return { ...user, _id: result.insertedId.toString() }
  }

  static async updateRole(userId: string, role: UserRole): Promise<boolean> {
    const collection = await this.getCollection()
    const { ObjectId } = require('mongodb')
    
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          role,
          updatedAt: new Date()
        }
      }
    )

    return result.modifiedCount > 0
  }

  static async findAll(): Promise<User[]> {
    const collection = await this.getCollection()
    return await collection.find({}).toArray()
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  }

  static async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const collection = await this.getCollection()
    const { ObjectId } = require('mongodb')

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    )

    return result.modifiedCount > 0
  }

  static async delete(userId: string): Promise<boolean> {
    const collection = await this.getCollection()
    const { ObjectId } = require('mongodb')

    const result = await collection.deleteOne({ _id: new ObjectId(userId) })
    return result.deletedCount > 0
  }
}
