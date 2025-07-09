import clientPromise from '../mongodb'
import { VariableConfig, VariableType } from '@/types/product'
import { ObjectId } from 'mongodb'

export class VariableConfigModel {
  private static async getCollection() {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    return db.collection<VariableConfig>('variableConfigs')
  }

  static async findAll(): Promise<VariableConfig[]> {
    const collection = await this.getCollection()
    return await collection.find({}).sort({ order: 1 }).toArray()
  }

  static async findActive(): Promise<VariableConfig[]> {
    const collection = await this.getCollection()
    return await collection.find({ isActive: true }).sort({ order: 1 }).toArray()
  }

  static async findByType(type: VariableType): Promise<VariableConfig | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ type, isActive: true })
  }

  static async findById(id: string): Promise<VariableConfig | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ _id: new ObjectId(id) } as any)
  }

  static async create(configData: Omit<VariableConfig, '_id' | 'createdAt' | 'updatedAt'>): Promise<VariableConfig> {
    const collection = await this.getCollection()

    const config: Omit<VariableConfig, '_id'> = {
      ...configData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(config)
    return { ...config, _id: result.insertedId.toString() }
  }

  static async update(id: string, updateData: Partial<VariableConfig>): Promise<VariableConfig | null> {
    const collection = await this.getCollection()

    console.log('VariableConfigModel.update - ID:', id)
    console.log('VariableConfigModel.update - updateData:', updateData)

    // 验证 ObjectId 格式
    if (!ObjectId.isValid(id)) {
      console.error('无效的 ObjectId:', id)
      return null
    }

    // 移除不可修改的字段，确保不会尝试更新 _id
    const { _id, createdAt, updatedAt, ...safeUpdateData } = updateData

    console.log('VariableConfigModel.update - safeUpdateData:', safeUpdateData)

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) } as any,
      {
        $set: {
          ...safeUpdateData,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    console.log('VariableConfigModel.update - result:', result)
    // MongoDB的findOneAndUpdate返回的是文档本身，不是包含value属性的对象
    return result
  }

  static async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ _id: new ObjectId(id) } as any)
    return result.deletedCount > 0
  }

  // 初始化默认变量配置
  static async initializeDefaultConfigs(): Promise<void> {
    const collection = await this.getCollection()
    
    // 检查是否已有配置
    const existingCount = await collection.countDocuments()
    if (existingCount > 0) {
      console.log('变量配置已存在，跳过初始化')
      return
    }

    const defaultConfigs: Omit<VariableConfig, '_id' | 'createdAt' | 'updatedAt'>[] = [
      {
        type: 'colorTemperature',
        label: '色温',
        options: [
          { value: '2700K', code: '27', isDefault: false, order: 1 },
          { value: '3000K', code: '30', isDefault: true, order: 2 },
          { value: '3500K', code: '35', isDefault: false, order: 3 },
          { value: '4000K', code: '40', isDefault: false, order: 4 },
          { value: '5000K', code: '50', isDefault: false, order: 5 },
          { value: '6500K', code: '65', isDefault: false, order: 6 },
          { value: '色温可调', code: 'TW', isDefault: false, order: 7 }
        ],
        isRequired: true,
        allowMultiple: false,
        order: 1,
        isActive: true
      },
      {
        type: 'beamAngle',
        label: '光束角',
        options: [
          { value: '10°', code: '10', isDefault: false, order: 1 },
          { value: '15°', code: '15', isDefault: false, order: 2 },
          { value: '24°', code: '24', isDefault: true, order: 3 },
          { value: '36°', code: '36', isDefault: false, order: 4 },
          { value: '60°', code: '60', isDefault: false, order: 5 },
          { value: '90°', code: '90', isDefault: false, order: 6 },
          { value: '120°', code: '120', isDefault: false, order: 7 }
        ],
        isRequired: true,
        allowMultiple: false,
        order: 2,
        isActive: true
      },
      {
        type: 'appearanceColor',
        label: '外观颜色',
        options: [
          { value: '白色', code: 'W', isDefault: true, order: 1 },
          { value: '黑色', code: 'B', isDefault: false, order: 2 },
          { value: '银色', code: 'S', isDefault: false, order: 3 },
          { value: '金色', code: 'G', isDefault: false, order: 4 },
          { value: '白色边框/银色反射器', code: 'WS', isDefault: false, order: 5 },
          { value: '黑色边框/银色反射器', code: 'BS', isDefault: false, order: 6 },
          { value: '白色边框/金色反射器', code: 'WG', isDefault: false, order: 7 },
          { value: '黑色边框/金色反射器', code: 'BG', isDefault: false, order: 8 }
        ],
        isRequired: false,
        allowMultiple: false,
        order: 3,
        isActive: true
      },
      {
        type: 'controlMethod',
        label: '控制方式',
        options: [
          { value: 'ON/OFF', code: 'O', isDefault: true, order: 1 },
          { value: '0-10V', code: 'V', isDefault: false, order: 2 },
          { value: 'DALI', code: 'D', isDefault: false, order: 3 },
          { value: 'BLE', code: 'B', isDefault: false, order: 4 },
          { value: '调光', code: 'DIM', isDefault: false, order: 5 },
          { value: 'PWM', code: 'P', isDefault: false, order: 6 }
        ],
        isRequired: false,
        allowMultiple: false,
        order: 4,
        isActive: true
      }
    ]

    // 批量插入默认配置
    for (const config of defaultConfigs) {
      await this.create(config)
    }

    console.log('默认变量配置初始化完成')
  }

  // 获取变量选项的代码映射
  static async getCodeMapping(type: VariableType): Promise<Map<string, string>> {
    console.log(`[DEBUG] VariableConfigModel.getCodeMapping - 类型: ${type}`)
    const config = await this.findByType(type)
    console.log(`[DEBUG] 找到的配置:`, config ? { type: config.type, optionsCount: config.options.length } : null)
    const mapping = new Map<string, string>()

    if (config) {
      config.options.forEach(option => {
        mapping.set(option.value, option.code)
        console.log(`[DEBUG] 添加映射: ${option.value} -> ${option.code}`)
      })
    }

    console.log(`[DEBUG] 最终映射大小: ${mapping.size}`)
    return mapping
  }

  // 根据代码获取显示值
  static async getValueByCode(type: VariableType, code: string): Promise<string | null> {
    const config = await this.findByType(type)

    if (config) {
      const option = config.options.find(opt => opt.code === code)
      return option?.value || null
    }

    return null
  }

  // 清空所有变量配置（调试用）
  static async clearAll(): Promise<void> {
    const collection = await this.getCollection()
    await collection.deleteMany({})
  }
}
