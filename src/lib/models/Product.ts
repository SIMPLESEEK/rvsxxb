import clientPromise from '../mongodb'
import { Product } from '@/types/product'
import { ObjectId } from 'mongodb'

export class ProductModel {
  private static async getCollection() {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    return db.collection<Product>('products')
  }

  static async findAll(): Promise<Product[]> {
    const collection = await this.getCollection()
    return await collection.find({}).sort({ order: 1, createdAt: -1 }).toArray()
  }

  static async findById(id: string): Promise<Product | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ _id: new ObjectId(id) })
  }

  static async create(productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const collection = await this.getCollection()

    const product: Omit<Product, '_id'> = {
      ...productData,
      // 确保必要字段存在
      isActive: productData.isActive !== false,
      isNew: productData.isNew || false,
      order: productData.order || 999,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(product)
    return { ...product, _id: result.insertedId.toString() }
  }

  static async update(id: string, productData: Partial<Product>): Promise<boolean> {
    const collection = await this.getCollection()

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...productData,
          updatedAt: new Date()
        }
      }
    )

    return result.modifiedCount > 0
  }

  static async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
  }

  static async findByFilters(filters: {
    isActive?: boolean
    isFeatured?: boolean
    productType?: string
    brand?: string
  }): Promise<Product[]> {
    const collection = await this.getCollection()
    const query: any = {}

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive
    }
    if (filters.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured
    }
    if (filters.productType) {
      query.productType = filters.productType
    }
    if (filters.brand) {
      query.brand = filters.brand
    }

    return await collection.find(query).sort({ order: 1, createdAt: -1 }).toArray()
  }

  static async updateOrder(id: string, order: number): Promise<boolean> {
    const collection = await this.getCollection()

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          order: order,
          updatedAt: new Date()
        }
      }
    )

    return result.modifiedCount > 0
  }

  static async toggleActive(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    const product = await this.findById(id)

    if (!product) return false

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: !product.isActive,
          updatedAt: new Date()
        }
      }
    )

    return result.modifiedCount > 0
  }

  static async toggleFeatured(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    const product = await this.findById(id)

    if (!product) return false

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isFeatured: !product.isFeatured,
          updatedAt: new Date()
        }
      }
    )

    return result.modifiedCount > 0
  }

  static async count(): Promise<number> {
    const collection = await this.getCollection()
    return await collection.countDocuments()
  }

  static async deleteAll(): Promise<number> {
    const collection = await this.getCollection()
    const result = await collection.deleteMany({})
    return result.deletedCount
  }
}
