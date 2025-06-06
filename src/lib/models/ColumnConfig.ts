import clientPromise from '../mongodb'
import { ColumnConfig } from '@/types/product'

export class ColumnConfigModel {
  private static async getCollection() {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    return db.collection<ColumnConfig>('columnConfigs')
  }

  static async findAll(): Promise<ColumnConfig[]> {
    const collection = await this.getCollection()
    return await collection.find({}).sort({ order: 1 }).toArray()
  }

  static async findVisible(): Promise<ColumnConfig[]> {
    const collection = await this.getCollection()
    return await collection.find({ isVisible: true }).sort({ order: 1 }).toArray()
  }

  static async findByRole(role: string): Promise<ColumnConfig[]> {
    const collection = await this.getCollection()
    return await collection.find({ 
      isVisible: true,
      roles: { $in: [role] }
    }).sort({ order: 1 }).toArray()
  }

  static async create(columnData: Omit<ColumnConfig, '_id'>): Promise<ColumnConfig> {
    try {
      console.log('ColumnConfigModel.create - 开始创建列配置:', columnData)

      const collection = await this.getCollection()
      console.log('数据库集合获取成功')

      const result = await collection.insertOne(columnData)
      console.log('数据库插入成功, insertedId:', result.insertedId)

      const createdColumn = { ...columnData, _id: result.insertedId.toString() }
      console.log('返回创建的列配置:', createdColumn)

      return createdColumn
    } catch (error) {
      console.error('ColumnConfigModel.create - 创建失败:', error)
      throw error
    }
  }

  static async update(id: string, columnData: Partial<ColumnConfig>): Promise<boolean> {
    const collection = await this.getCollection()
    const { ObjectId } = require('mongodb')

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: columnData }
    )

    return result.modifiedCount > 0
  }

  static async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    const { ObjectId } = require('mongodb')

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
  }

  static async initializeDefaultColumns(): Promise<void> {
    const collection = await this.getCollection()
    
    // 检查是否已有配置
    const existingCount = await collection.countDocuments()
    if (existingCount > 0) {
      return
    }

    // 创建默认列配置
    const defaultColumns: Omit<ColumnConfig, '_id'>[] = [
      {
        key: 'order',
        label: '显示顺序',
        type: 'number',
        roles: ['admin'],
        width: '3%',
        bg: '#f0f0f0',
        order: 0.5,
        isVisible: true
      },
      {
        key: 'productType',
        label: '产品类型',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '6%',
        bg: '#e6f7e6',
        order: 1,
        isVisible: true
      },
      {
        key: 'brand',
        label: '品牌',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '3%',
        bg: '#e6f7e6',
        order: 2,
        isVisible: true
      },
      {
        key: 'images.display',
        label: '产品图',
        type: 'image',
        roles: ['user', 'dealer', 'admin'],
        width: '6%',
        bg: '#e6f7e6',
        order: 3,
        isVisible: true
      },
      {
        key: 'images.dimension',
        label: '尺寸图',
        type: 'image',
        roles: ['user', 'dealer', 'admin'],
        width: '6%',
        bg: '#e6f7e6',
        order: 4,
        isVisible: true
      },
      {
        key: 'images.accessories',
        label: '配件图',
        type: 'image',
        roles: ['user', 'dealer', 'admin'],
        width: '6%',
        bg: '#e6f7e6',
        order: 5,
        isVisible: true
      },
      {
        key: 'specifications.detailed',
        label: '详细规格参数',
        type: 'multiline',
        roles: ['user', 'dealer', 'admin'],
        width: '20%',
        bg: '#e6f7e6',
        order: 6,
        isVisible: true
      },
      {
        key: 'specifications.brief',
        label: '简要规格参数',
        type: 'singleline',
        roles: ['user', 'dealer', 'admin'],
        width: '15%',
        bg: '#e6f7e6',
        order: 7,
        isVisible: true
      },
      {
        key: 'appearance.color',
        label: '外观颜色',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '4%',
        bg: '#e6f7e6',
        order: 8,
        isVisible: true
      },
      {
        key: 'appearance.installation',
        label: '安装方式',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '5%',
        bg: '#e6f7e6',
        order: 9,
        isVisible: true
      },
      {
        key: 'appearance.cutoutSize',
        label: '开孔尺寸',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '4%',
        bg: '#e6f7e6',
        order: 10,
        isVisible: true
      },
      {
        key: 'control',
        label: '控制方式',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '6%',
        bg: '#e6f7e6',
        order: 11,
        isVisible: true
      },
      {
        key: 'notes',
        label: '备注',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '7%',
        bg: '#e6f7e6',
        order: 12,
        isVisible: true
      },
      {
        key: 'model',
        label: '产品型号',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '5%',
        bg: '#e6f7e6',
        order: 13,
        isVisible: true
      },
      {
        key: 'pricing.unitPrice',
        label: '含税单价',
        type: 'number',
        roles: ['dealer', 'admin'],
        width: '3%',
        bg: '#ffe7c2',
        order: 14,
        isVisible: true
      },
      {
        key: 'pricing.deliveryTime',
        label: '预计交货时间',
        type: 'text',
        roles: ['dealer', 'admin'],
        width: '4%',
        bg: '#ffe7c2',
        order: 15,
        isVisible: true
      }
    ]

    await collection.insertMany(defaultColumns)
  }
}
