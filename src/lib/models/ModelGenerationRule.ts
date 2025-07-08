import clientPromise from '../mongodb'
import { ModelGenerationRule, VariableType } from '@/types/product'
import { ObjectId } from 'mongodb'

export class ModelGenerationRuleModel {
  private static async getCollection() {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    return db.collection<ModelGenerationRule>('modelGenerationRules')
  }

  static async findAll(): Promise<ModelGenerationRule[]> {
    const collection = await this.getCollection()
    return await collection.find({}).sort({ isDefault: -1, name: 1 }).toArray()
  }

  static async findActive(): Promise<ModelGenerationRule[]> {
    const collection = await this.getCollection()
    return await collection.find({ isActive: true }).sort({ isDefault: -1, name: 1 }).toArray()
  }

  static async findDefault(): Promise<ModelGenerationRule | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ isDefault: true, isActive: true })
  }

  static async findById(id: string): Promise<ModelGenerationRule | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ _id: new ObjectId(id) })
  }

  static async create(ruleData: Omit<ModelGenerationRule, '_id' | 'createdAt' | 'updatedAt'>): Promise<ModelGenerationRule> {
    const collection = await this.getCollection()

    // 如果设置为默认规则，先取消其他默认规则
    if (ruleData.isDefault) {
      await collection.updateMany(
        { isDefault: true },
        { $set: { isDefault: false, updatedAt: new Date() } }
      )
    }

    const rule: Omit<ModelGenerationRule, '_id'> = {
      ...ruleData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(rule)
    return { ...rule, _id: result.insertedId.toString() }
  }

  static async update(id: string, updateData: Partial<ModelGenerationRule>): Promise<ModelGenerationRule | null> {
    const collection = await this.getCollection()
    
    // 如果设置为默认规则，先取消其他默认规则
    if (updateData.isDefault) {
      await collection.updateMany(
        { _id: { $ne: new ObjectId(id) }, isDefault: true },
        { $set: { isDefault: false, updatedAt: new Date() } }
      )
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    )

    return result.value
  }

  static async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
  }

  // 初始化默认规则
  static async initializeDefaultRules(): Promise<void> {
    const collection = await this.getCollection()

    // 检查是否已有规则
    const existingCount = await collection.countDocuments()
    if (existingCount > 0) {
      console.log('型号生成规则已存在，跳过初始化')
      return
    }

    await this.createDefaultRules()
  }

  // 强制重新初始化默认规则（清除现有规则）
  static async forceReinitializeDefaultRules(): Promise<void> {
    const collection = await this.getCollection()

    // 删除所有现有规则
    const deleteResult = await collection.deleteMany({})
    console.log('删除了', deleteResult.deletedCount, '个现有型号生成规则')

    // 重新创建默认规则
    await this.createDefaultRules()
  }

  // 创建默认规则的具体实现
  private static async createDefaultRules(): Promise<void> {

    const defaultRules: Omit<ModelGenerationRule, '_id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: '标准四段式规则',
        description: '所有产品统一使用四段式型号：基础型号-色温光束角-外观-控制，如：RDU-T55-3515-WG-D',
        template: '{baseModel}-{colorTemperature}{beamAngle}-{appearanceColor}-{controlMethod}',
        variableMapping: {
          colorTemperature: {
            extractPattern: '(\\d+)K?',
            codeLength: 2,
            padChar: '0'
          },
          beamAngle: {
            extractPattern: '(\\d+)°?',
            codeLength: 2,
            padChar: '0'
          }
          // appearanceColor 和 controlMethod 不设置映射规则，
          // 这样会自动使用数据库中的代码映射
        },
        isDefault: true,
        isActive: true
      }
    ]

    // 批量插入默认规则
    for (const rule of defaultRules) {
      await this.create(rule)
    }

    console.log('默认型号生成规则初始化完成')
  }

  // 生成产品型号
  // 修正：确保所有产品都生成完整的4段式型号
  static async generateModel(
    baseModel: string,
    variables: { [key in VariableType]?: string },
    ruleId?: string
  ): Promise<string> {
    // 确保所有4个变量都有值
    const completeVariables = {
      colorTemperature: variables.colorTemperature || '3000K',
      beamAngle: variables.beamAngle || '24°',
      appearanceColor: variables.appearanceColor || '白色',
      controlMethod: variables.controlMethod || 'ON/OFF'
    }

    // 获取规则
    let rule: ModelGenerationRule | null
    if (ruleId) {
      rule = await this.findById(ruleId)
    } else {
      rule = await this.findDefault()
    }

    if (!rule) {
      // 如果没有规则，使用简单的4段式拼接
      const colorCode = completeVariables.colorTemperature.replace('K', '').padStart(2, '0')
      const beamCode = completeVariables.beamAngle.replace('°', '').padStart(2, '0')
      const appearanceCode = completeVariables.appearanceColor === '白色' ? 'W' :
                            completeVariables.appearanceColor === '黑色' ? 'B' : 'W'
      const controlCode = completeVariables.controlMethod === 'ON/OFF' ? 'O' :
                         completeVariables.controlMethod === 'DALI' ? 'D' : 'O'

      return `${baseModel}-${colorCode}${beamCode}-${appearanceCode}-${controlCode}`
    }

    // 使用规则生成型号
    let generatedModel = rule.template.replace('{baseModel}', baseModel)

    // 替换变量占位符
    Object.entries(completeVariables).forEach(([type, value]) => {
      const mapping = rule.variableMapping[type as VariableType]
      let code = value

      if (mapping) {
        // 使用提取模式获取代码
        const regex = new RegExp(mapping.extractPattern)
        const match = value.match(regex)
        if (match && match[1]) {
          code = match[1]

          // 应用长度和填充规则
          if (mapping.codeLength && mapping.padChar) {
            code = code.padStart(mapping.codeLength, mapping.padChar)
          }
        }
      }

      generatedModel = generatedModel.replace(`{${type}}`, code)
    })

    // 清理多余的分隔符，但保持4段式结构
    generatedModel = generatedModel.replace(/-+/g, '-').replace(/^-|-$/g, '')

    return generatedModel
  }

  // 验证规则模板
  static validateTemplate(template: string): { isValid: boolean, errors: string[] } {
    const errors: string[] = []
    
    // 检查是否包含基础型号占位符
    if (!template.includes('{baseModel}')) {
      errors.push('模板必须包含 {baseModel} 占位符')
    }
    
    // 检查占位符格式
    const placeholders = template.match(/\{[^}]+\}/g) || []
    const validPlaceholders = ['baseModel', 'colorTemperature', 'beamAngle', 'appearanceColor', 'controlMethod']
    
    placeholders.forEach(placeholder => {
      const name = placeholder.slice(1, -1) // 去掉大括号
      if (!validPlaceholders.includes(name)) {
        errors.push(`无效的占位符: ${placeholder}`)
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
