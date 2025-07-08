import clientPromise from '../mongodb'
import { ColumnConfig } from '@/types/product'
import { ObjectId } from 'mongodb'

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

    const result = await collection.updateOne(
      { _id: new ObjectId(id) } as any,
      { $set: columnData }
    )

    return result.modifiedCount > 0
  }

  static async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection()

    const result = await collection.deleteOne({ _id: new ObjectId(id) } as any)
    return result.deletedCount > 0
  }

  static async deleteAll(): Promise<number> {
    const collection = await this.getCollection()
    const result = await collection.deleteMany({})
    return result.deletedCount
  }

  static async initializeDefaultColumns(): Promise<void> {
    const collection = await this.getCollection()

    // 检查是否已有配置
    const existingCount = await collection.countDocuments()
    if (existingCount > 0) {
      return
    }

    // 创建完整的默认列配置（匹配ProductSelectionTableV3的硬编码配置）
    const defaultColumns: Omit<ColumnConfig, '_id'>[] = [
      // 基础产品信息列（按ProductSelectionTableV3的顺序）
      {
        key: 'order',
        label: '显示顺序',
        type: 'number',
        roles: ['admin'],
        width: '3%',
        bg: '#e6f7e6',
        order: 1,
        isVisible: true
      },
      {
        key: 'productType',
        label: '产品类型',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '6%',
        bg: '#e6f7e6',
        order: 2,
        isVisible: true
      },
      {
        key: 'brand',
        label: '品牌',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '4%',
        bg: '#e6f7e6',
        order: 3,
        isVisible: true
      },
      {
        key: 'model',
        label: '产品型号',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '8%',
        bg: '#e6f7e6',
        order: 4,
        isVisible: false
      },
      {
        key: 'images.display',
        label: '产品图',
        type: 'image',
        roles: ['user', 'dealer', 'admin'],
        width: '6%',
        bg: '#e6f7e6',
        order: 5,
        isVisible: true
      },
      {
        key: 'images.dimension',
        label: '尺寸图',
        type: 'image',
        roles: ['user', 'dealer', 'admin'],
        width: '6%',
        bg: '#e6f7e6',
        order: 6,
        isVisible: true
      },
      {
        key: 'images.accessories',
        label: '配件图',
        type: 'image',
        roles: ['user', 'dealer', 'admin'],
        width: '6%',
        bg: '#e6f7e6',
        order: 7,
        isVisible: true
      },
      {
        key: 'specifications.detailed',
        label: '技术参数',
        type: 'multiline',
        roles: ['user', 'dealer', 'admin'],
        width: '10%',
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
      // 4个变量参数列（在开孔尺寸后面插入）
      {
        key: 'colorTemperature',
        label: '色温',
        type: 'variable',
        roles: ['user', 'dealer', 'admin'],
        width: '7%',
        bg: '#e6f3ff',
        order: 11,
        isVisible: true
      },
      {
        key: 'beamAngle',
        label: '光束角',
        type: 'variable',
        roles: ['user', 'dealer', 'admin'],
        width: '7%',
        bg: '#e6f3ff',
        order: 12,
        isVisible: true
      },
      {
        key: 'appearanceColor',
        label: '外观颜色',
        type: 'variable',
        roles: ['user', 'dealer', 'admin'],
        width: '7%',
        bg: '#e6f3ff',
        order: 13,
        isVisible: true
      },
      {
        key: 'controlMethod',
        label: '控制方式',
        type: 'variable',
        roles: ['user', 'dealer', 'admin'],
        width: '7%',
        bg: '#e6f3ff',
        order: 14,
        isVisible: true
      },
      {
        key: 'productremark',
        label: '产品备注',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '5%',
        bg: '#e6f7e6',
        order: 15,
        isVisible: true
      },
      // 订货代码列（在含税价格前面插入）
      {
        key: 'orderCode',
        label: '订货代码',
        type: 'generated',
        roles: ['user', 'dealer', 'admin'],
        width: '12%',
        bg: '#e6ffe6',
        order: 16,
        isVisible: true
      },
      {
        key: 'pricing.unitPrice',
        label: '含税价格',
        type: 'number',
        roles: ['dealer', 'admin'],
        width: '4%',
        bg: '#e6f7e6',
        order: 17,
        isVisible: true
      },
      {
        key: 'pricing.marketPrice',
        label: '市场价格',
        type: 'number',
        roles: ['dealer', 'admin'],
        width: '4%',
        bg: '#e6f7e6',
        order: 18,
        isVisible: false
      },
      {
        key: 'pricing.deliveryTime',
        label: '预计交货',
        type: 'number',
        roles: ['dealer', 'admin'],
        width: '5%',
        bg: '#e6f7e6',
        order: 19,
        isVisible: true
      },
      // 管理员专用的供应商和成本相关列（在产品选型表中显示的）
      {
        key: 'vendorLED',
        label: 'LED',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '5%',
        bg: '#f8f9fa',
        order: 24,
        isVisible: true
      },
      {
        key: 'vendorDriver',
        label: '驱动',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '5%',
        bg: '#f8f9fa',
        order: 26,
        isVisible: true
      },
      // 添加按钮列（特殊列，仅用于配置）
      {
        key: 'addButton',
        label: '添加',
        type: 'action',
        roles: ['user', 'dealer', 'admin'],
        width: '4%',
        bg: '#f8f9fa',
        order: 36,
        isVisible: true
      },
      // 管理员专用的供应商和成本相关列（不在产品选型表中显示的）
      {
        key: 'vendorBody1',
        label: '套件1',
        type: 'text',
        roles: ['admin'],
        width: '5%',
        bg: '#ffe7e7',
        order: 20,
        isVisible: false
      },
      {
        key: 'costBody1',
        label: '套件1成本',
        type: 'number',
        roles: ['admin'],
        width: '4%',
        bg: '#ffe7e7',
        order: 21,
        isVisible: false
      },
      {
        key: 'vendorBody2',
        label: '套件2',
        type: 'text',
        roles: ['admin'],
        width: '5%',
        bg: '#ffe7e7',
        order: 22,
        isVisible: false
      },
      {
        key: 'costBody2',
        label: '套件2成本',
        type: 'number',
        roles: ['admin'],
        width: '4%',
        bg: '#ffe7e7',
        order: 23,
        isVisible: false
      },
      {
        key: 'costLED',
        label: 'LED成本',
        type: 'number',
        roles: ['admin'],
        width: '4%',
        bg: '#ffe7e7',
        order: 25,
        isVisible: false
      },
      {
        key: 'costDriver',
        label: '驱动成本',
        type: 'number',
        roles: ['admin'],
        width: '4%',
        bg: '#ffe7e7',
        order: 27,
        isVisible: false
      },
      {
        key: 'vendorLabel',
        label: '标签品牌',
        type: 'text',
        roles: ['admin'],
        width: '5%',
        bg: '#ffe7e7',
        order: 28,
        isVisible: false
      },
      {
        key: 'Label',
        label: '标签内容',
        type: 'multiline',
        roles: ['admin'],
        width: '8%',
        bg: '#ffe7e7',
        order: 29,
        isVisible: false
      },
      {
        key: 'vendorAssemble',
        label: '组装',
        type: 'text',
        roles: ['admin'],
        width: '5%',
        bg: '#ffe7e7',
        order: 30,
        isVisible: false
      },
      {
        key: 'costAssemble',
        label: '组装成本',
        type: 'number',
        roles: ['admin'],
        width: '4%',
        bg: '#ffe7e7',
        order: 31,
        isVisible: false
      },
      {
        key: 'vendorOther',
        label: '其他部件',
        type: 'text',
        roles: ['admin'],
        width: '5%',
        bg: '#ffe7e7',
        order: 32,
        isVisible: false
      },
      {
        key: 'costOther',
        label: '其他成本',
        type: 'number',
        roles: ['admin'],
        width: '4%',
        bg: '#ffe7e7',
        order: 33,
        isVisible: false
      },
      {
        key: 'vendorODM',
        label: '整灯外购',
        type: 'text',
        roles: ['admin'],
        width: '5%',
        bg: '#ffe7e7',
        order: 34,
        isVisible: false
      },
      {
        key: 'costODM',
        label: '整灯外购成本',
        type: 'number',
        roles: ['admin'],
        width: '4%',
        bg: '#ffe7e7',
        order: 35,
        isVisible: false
      }
    ]

    await collection.insertMany(defaultColumns)
  }
}
