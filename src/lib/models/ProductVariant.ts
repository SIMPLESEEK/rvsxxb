import clientPromise from '../mongodb'
import { ProductVariant, VariableType } from '@/types/product'
import { ObjectId } from 'mongodb'

export class ProductVariantModel {
  private static async getCollection() {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    return db.collection<ProductVariant>('productVariants')
  }

  static async findAll(): Promise<ProductVariant[]> {
    const collection = await this.getCollection()
    return await collection.find({}).sort({ order: 1, createdAt: -1 }).toArray()
  }

  static async findActive(): Promise<ProductVariant[]> {
    const collection = await this.getCollection()
    return await collection.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).toArray()
  }

  static async findByBaseProduct(baseProductId: string): Promise<ProductVariant[]> {
    const collection = await this.getCollection()
    return await collection.find({ 
      baseProductId, 
      isActive: true 
    }).sort({ order: 1 }).toArray()
  }

  static async findById(id: string): Promise<ProductVariant | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ _id: new ObjectId(id) } as any)
  }

  static async findByModel(generatedModel: string): Promise<ProductVariant | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ generatedModel })
  }

  static async create(variantData: Omit<ProductVariant, '_id' | 'createdAt' | 'updatedAt'>): Promise<ProductVariant> {
    const collection = await this.getCollection()

    const variant: Omit<ProductVariant, '_id'> = {
      ...variantData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(variant)
    return { ...variant, _id: result.insertedId.toString() }
  }

  static async update(id: string, updateData: Partial<ProductVariant>): Promise<ProductVariant | null> {
    const collection = await this.getCollection()
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) } as any,
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    return result || null
  }

  static async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ _id: new ObjectId(id) } as any)
    return result.deletedCount > 0
  }

  static async deleteByBaseProduct(baseProductId: string): Promise<number> {
    const collection = await this.getCollection()
    const result = await collection.deleteMany({ baseProductId })
    return result.deletedCount
  }

  // 批量创建变量组合
  static async createBatch(variants: Omit<ProductVariant, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<ProductVariant[]> {
    const collection = await this.getCollection()

    const variantsWithTimestamps = variants.map(variant => ({
      ...variant,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    const result = await collection.insertMany(variantsWithTimestamps)
    
    return variantsWithTimestamps.map((variant, index) => ({
      ...variant,
      _id: result.insertedIds[index].toString()
    }))
  }

  // 检查变量组合是否已存在
  static async checkVariantExists(baseProductId: string, variables: { [key in VariableType]?: string }): Promise<boolean> {
    const collection = await this.getCollection()
    
    const existingVariant = await collection.findOne({
      baseProductId,
      variables
    })
    
    return !!existingVariant
  }

  // 根据变量搜索产品变量
  static async searchByVariables(searchVariables: Partial<{ [key in VariableType]: string }>): Promise<ProductVariant[]> {
    const collection = await this.getCollection()
    
    const query: any = { isActive: true }
    
    // 构建变量查询条件
    Object.entries(searchVariables).forEach(([type, value]) => {
      if (value) {
        query[`variables.${type}`] = value
      }
    })
    
    return await collection.find(query).sort({ order: 1 }).toArray()
  }

  // 获取基础产品的下一个可用排序号
  static async getNextOrderForBaseProduct(baseProductId: string, baseOrder: number): Promise<number> {
    const collection = await this.getCollection()
    
    // 查找该基础产品的所有变量，获取最大的order值
    const variants = await collection.find({ 
      baseProductId 
    }).sort({ order: -1 }).limit(1).toArray()
    
    if (variants.length === 0) {
      // 如果没有变量，返回基础order + 0.001
      return parseFloat((baseOrder + 0.001).toFixed(3))
    }
    
    const maxOrder = variants[0].order
    
    // 如果最大order小于基础order + 1，则在其基础上增加0.001
    if (maxOrder < baseOrder + 1) {
      return parseFloat((maxOrder + 0.001).toFixed(3))
    }
    
    // 否则返回基础order + 0.001
    return parseFloat((baseOrder + 0.001).toFixed(3))
  }

  // 统计基础产品的变量数量
  static async countByBaseProduct(baseProductId: string): Promise<number> {
    const collection = await this.getCollection()
    return await collection.countDocuments({ baseProductId, isActive: true })
  }

  // 获取所有唯一的变量值（用于搜索建议）
  static async getUniqueVariableValues(type: VariableType): Promise<string[]> {
    const collection = await this.getCollection()

    const pipeline = [
      { $match: { isActive: true } },
      { $group: { _id: `$variables.${type}` } },
      { $match: { _id: { $ne: null } } },
      { $sort: { _id: 1 } }
    ]

    const result = await collection.aggregate(pipeline).toArray()
    return result.map(item => item._id)
  }

  // 统计所有产品变量数量
  static async count(): Promise<number> {
    const collection = await this.getCollection()
    return await collection.countDocuments()
  }

  // 删除所有产品变量
  static async deleteAll(): Promise<number> {
    const collection = await this.getCollection()
    const result = await collection.deleteMany({})
    return result.deletedCount
  }
}
