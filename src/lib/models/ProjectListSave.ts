import clientPromise from '../mongodb'
import { ObjectId } from 'mongodb'

export interface ProjectListSave {
  _id?: string
  userId: string
  name: string // 暂存名称
  projectList: any[] // 项目清单数据
  customerInfo: {
    name: string
    projectName: string
    contact: string
    phone: string
    email: string
  }
  quotationNotes: string
  quotationNumber: string
  projectFields: {[key: string]: {useArea: string, projectCode: string, remarks: string}}
  createdAt: Date
  updatedAt: Date
}

export class ProjectListSaveModel {
  private static async getCollection() {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    return db.collection<ProjectListSave>('projectListSaves')
  }

  // 获取用户的所有暂存
  static async findByUserId(userId: string): Promise<ProjectListSave[]> {
    const collection = await this.getCollection()
    return await collection.find({ userId }).sort({ updatedAt: -1 }).toArray()
  }

  // 根据ID获取暂存
  static async findById(id: string): Promise<ProjectListSave | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ _id: new ObjectId(id) })
  }

  // 创建新的暂存
  static async create(saveData: Omit<ProjectListSave, '_id' | 'createdAt' | 'updatedAt'>): Promise<ProjectListSave> {
    const collection = await this.getCollection()
    
    const projectSave: Omit<ProjectListSave, '_id'> = {
      ...saveData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(projectSave)
    return { ...projectSave, _id: result.insertedId.toString() }
  }

  // 更新暂存
  static async update(id: string, saveData: Partial<Omit<ProjectListSave, '_id' | 'userId' | 'createdAt'>>): Promise<ProjectListSave | null> {
    const collection = await this.getCollection()
    
    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...saveData,
          updatedAt: new Date()
        }
      }
    )

    return await this.findById(id)
  }

  // 删除暂存
  static async delete(id: string, userId: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ 
      _id: new ObjectId(id),
      userId // 确保只能删除自己的暂存
    })
    return result.deletedCount > 0
  }

  // 获取用户最近的暂存
  static async getLatest(userId: string): Promise<ProjectListSave | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ userId }, { sort: { updatedAt: -1 } })
  }

  // 统计所有项目清单保存数量
  static async count(): Promise<number> {
    const collection = await this.getCollection()
    return await collection.countDocuments()
  }

  // 删除所有项目清单保存
  static async deleteAll(): Promise<number> {
    const collection = await this.getCollection()
    const result = await collection.deleteMany({})
    return result.deletedCount
  }
}
