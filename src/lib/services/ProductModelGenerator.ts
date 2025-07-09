import { VariableType } from '@/types/product'
import { ModelGenerationRuleModel } from '@/lib/models/ModelGenerationRule'
import { VariableConfigModel } from '@/lib/models/VariableConfig'

export class ProductModelGenerator {
  /**
   * 生成产品型号
   * @param baseModel 基础型号
   * @param variables 变量选择
   * @param ruleId 可选的规则ID，如果不提供则使用默认规则
   * @returns 生成的完整型号
   */
  static async generateModel(
    baseModel: string,
    variables: { [key in VariableType]?: string },
    ruleId?: string
  ): Promise<string> {
    try {
      // 获取生成规则
      let rule
      if (ruleId) {
        rule = await ModelGenerationRuleModel.findById(ruleId)
      } else {
        rule = await ModelGenerationRuleModel.findDefault()
      }

      if (!rule) {
        // 如果没有规则，使用简单拼接
        return await this.generateSimpleModel(baseModel, variables)
      }

      // 使用规则生成型号
      return await this.generateModelWithRule(baseModel, variables, rule)
    } catch (error) {
      console.error('生成产品型号失败:', error)
      // 降级到简单模式
      return await this.generateSimpleModel(baseModel, variables)
    }
  }

  /**
   * 使用规则生成型号
   * 修正：确保所有4个变量都有值，生成完整的4段式型号
   */
  private static async generateModelWithRule(
    baseModel: string,
    variables: { [key in VariableType]?: string },
    rule: any
  ): Promise<string> {
    let generatedModel = rule.template.replace('{baseModel}', baseModel)

    // 获取数据库中的默认值
    const defaultValues = await this.getDefaultValues()

    // 确保所有4个变量都有值，优先使用传入的变量，其次使用数据库默认值
    const completeVariables = {
      colorTemperature: variables.colorTemperature || defaultValues.colorTemperature,
      beamAngle: variables.beamAngle || defaultValues.beamAngle,
      appearanceColor: variables.appearanceColor || defaultValues.appearanceColor,
      controlMethod: variables.controlMethod || defaultValues.controlMethod
    }

    // 替换变量占位符
    for (const [type, value] of Object.entries(completeVariables)) {
      const mapping = rule.variableMapping[type as VariableType]
      let code = value

      if (mapping) {
        // 使用提取模式获取代码
        code = await this.extractCode(value, mapping, type as VariableType)
      } else {
        // 如果没有映射规则，从数据库获取代码
        code = await this.getCodeFromDatabase(type as VariableType, value)
      }

      generatedModel = generatedModel.replace(`{${type}}`, code)
    }

    // 清理多余的分隔符，但保持4段式结构
    generatedModel = generatedModel.replace(/-+/g, '-').replace(/^-|-$/g, '')

    return generatedModel
  }

  /**
   * 提取变量代码
   */
  private static async extractCode(
    value: string,
    mapping: any,
    type: VariableType
  ): Promise<string> {
    try {
      // 使用提取模式获取代码
      const regex = new RegExp(mapping.extractPattern)
      const match = value.match(regex)
      let code = match && match[1] ? match[1] : value

      // 应用长度和填充规则
      if (mapping.codeLength && mapping.padChar) {
        if (code.length > mapping.codeLength) {
          // 如果代码长度超过指定长度，截断到指定长度
          code = code.substring(0, mapping.codeLength)
        } else {
          // 如果代码长度不足，用指定字符填充
          code = code.padStart(mapping.codeLength, mapping.padChar)
        }
      }

      return code
    } catch (error) {
      console.error('提取变量代码失败:', error)
      // 降级到默认代码
      return await this.getDefaultCode(type, value)
    }
  }

  /**
   * 获取默认代码（从变量配置中获取）
   */
  private static async getDefaultCode(type: VariableType, value: string): Promise<string> {
    try {
      const codeMapping = await VariableConfigModel.getCodeMapping(type)
      return codeMapping.get(value) || this.extractSimpleCode(type, value)
    } catch (error) {
      console.error('获取默认代码失败:', error)
      return this.extractSimpleCode(type, value)
    }
  }

  /**
   * 获取所有变量类型的默认值
   */
  private static async getDefaultValues(): Promise<{ [key in VariableType]: string }> {
    try {
      const configs = await VariableConfigModel.findActive()
      const defaultValues: { [key in VariableType]: string } = {
        colorTemperature: '3000K',
        beamAngle: '24°',
        appearanceColor: '白色',
        controlMethod: 'ON/OFF'
      }

      // 从数据库配置中获取默认值
      configs.forEach(config => {
        const defaultOption = config.options.find(opt => opt.isDefault)
        if (defaultOption) {
          defaultValues[config.type] = defaultOption.value
        }
      })

      return defaultValues
    } catch (error) {
      console.error('获取默认值失败:', error)
      // 返回硬编码的默认值作为最后的降级方案
      return {
        colorTemperature: '3000K',
        beamAngle: '24°',
        appearanceColor: '白色',
        controlMethod: 'ON/OFF'
      }
    }
  }

  /**
   * 从数据库配置获取变量值对应的代码
   */
  private static async getCodeFromDatabase(type: VariableType, value: string): Promise<string> {
    try {
      console.log(`[DEBUG] 获取代码映射 - 类型: ${type}, 值: ${value}`)
      const codeMapping = await VariableConfigModel.getCodeMapping(type)
      console.log(`[DEBUG] 代码映射结果:`, Array.from(codeMapping.entries()))
      const code = codeMapping.get(value)
      console.log(`[DEBUG] 找到的代码: ${code}`)

      if (code) {
        return code
      }

      // 如果数据库中没有找到，使用简单提取逻辑作为降级
      console.warn(`数据库中未找到 ${type}:${value} 的代码映射，使用简单提取逻辑`)
      const fallbackCode = this.extractSimpleCode(type, value)
      console.log(`[DEBUG] 降级代码: ${fallbackCode}`)
      return fallbackCode
    } catch (error) {
      console.error(`获取 ${type}:${value} 代码失败:`, error)
      return this.extractSimpleCode(type, value)
    }
  }

  /**
   * 简单代码提取逻辑
   */
  private static extractSimpleCode(type: VariableType, value: string): string {
    switch (type) {
      case 'colorTemperature':
        // 从 "3000K" 提取 "30"
        const tempMatch = value.match(/(\d+)K?/)
        return tempMatch ? tempMatch[1].substring(0, 2) : value

      case 'beamAngle':
        // 从 "24°" 提取 "24"
        const angleMatch = value.match(/(\d+)°?/)
        return angleMatch ? angleMatch[1].padStart(2, '0') : value

      case 'appearanceColor':
        // 颜色映射
        const colorMap: { [key: string]: string } = {
          '白色': 'W',
          '黑色': 'B',
          '银色': 'S',
          '金色': 'G',
          '白色边框/银色反射器': 'WS',
          '黑色边框/银色反射器': 'BS',
          '白色边框/金色反射器': 'WG',
          '黑色边框/金色反射器': 'BG'
        }
        return colorMap[value] || 'W'

      case 'controlMethod':
        // 控制方式映射
        const controlMap: { [key: string]: string } = {
          'ON/OFF': 'O',
          'Onoff': 'O',
          '0-10V': 'V',
          'DALI': 'D',
          'BLE': 'B',
          '调光': 'DIM',
          'PWM': 'P'
        }
        return controlMap[value] || 'O'

      default:
        return value
    }
  }

  /**
   * 简单型号生成（降级方案）
   * 修正：使用数据库配置，避免硬编码
   */
  private static async generateSimpleModel(
    baseModel: string,
    variables: { [key in VariableType]?: string }
  ): Promise<string> {
    const parts = [baseModel]

    try {
      // 获取默认值和代码映射
      const defaultValues = await this.getDefaultValues()

      // 按固定顺序添加变量代码，如果没有提供则使用数据库中的默认值
      const colorTempValue = variables.colorTemperature || defaultValues.colorTemperature
      const beamAngleValue = variables.beamAngle || defaultValues.beamAngle
      const appearanceValue = variables.appearanceColor || defaultValues.appearanceColor
      const controlValue = variables.controlMethod || defaultValues.controlMethod

      // 从数据库配置获取代码
      const colorTempCode = await this.getCodeFromDatabase('colorTemperature', colorTempValue)
      const beamAngleCode = await this.getCodeFromDatabase('beamAngle', beamAngleValue)
      const appearanceCode = await this.getCodeFromDatabase('appearanceColor', appearanceValue)
      const controlCode = await this.getCodeFromDatabase('controlMethod', controlValue)

      // 组合成完整的4段式型号：基础型号-色温光束角-外观-控制
      parts.push(colorTempCode + beamAngleCode)
      parts.push(appearanceCode)
      parts.push(controlCode)

      return parts.join('-')
    } catch (error) {
      console.error('简单型号生成失败，使用最基础的降级方案:', error)
      // 最后的降级方案：使用基础型号
      return baseModel
    }
  }

  /**
   * 批量生成型号
   */
  static async generateBatchModels(
    baseModel: string,
    variableCombinations: Array<{ [key in VariableType]?: string }>,
    ruleId?: string
  ): Promise<string[]> {
    const results: string[] = []

    for (const variables of variableCombinations) {
      try {
        const generatedModel = await this.generateModel(baseModel, variables, ruleId)
        results.push(generatedModel)
      } catch (error) {
        console.error('批量生成型号失败:', error, { baseModel, variables })
        // 添加错误标记
        results.push(`ERROR-${baseModel}`)
      }
    }

    return results
  }

  /**
   * 验证生成的型号是否有效
   */
  static validateGeneratedModel(model: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // 基本格式检查
    if (!model || model.trim().length === 0) {
      errors.push('型号不能为空')
    }

    if (model.includes('ERROR-')) {
      errors.push('型号生成过程中出现错误')
    }

    // 检查是否包含无效字符
    if (!/^[A-Za-z0-9\-_]+$/.test(model)) {
      errors.push('型号包含无效字符，只允许字母、数字、连字符和下划线')
    }

    // 检查长度
    if (model.length > 50) {
      errors.push('型号长度不能超过50个字符')
    }

    // 检查是否以连字符开头或结尾
    if (model.startsWith('-') || model.endsWith('-')) {
      errors.push('型号不能以连字符开头或结尾')
    }

    // 检查是否有连续的连字符
    if (model.includes('--')) {
      errors.push('型号不能包含连续的连字符')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 解析型号中的变量信息
   */
  static async parseModelVariables(
    model: string,
    baseModel: string,
    ruleId?: string
  ): Promise<{ [key in VariableType]?: string } | null> {
    try {
      // 获取生成规则
      let rule
      if (ruleId) {
        rule = await ModelGenerationRuleModel.findById(ruleId)
      } else {
        rule = await ModelGenerationRuleModel.findDefault()
      }

      if (!rule) {
        return null
      }

      // 简单的解析逻辑（这里可以根据需要扩展）
      const suffix = model.replace(baseModel, '').replace(/^-/, '')
      const parts = suffix.split('-')

      const variables: { [key in VariableType]?: string } = {}

      // 这里需要根据具体的规则来解析
      // 暂时使用简单的解析逻辑
      if (parts.length >= 1 && parts[0].length >= 4) {
        // 假设第一部分是色温+光束角
        const tempBeamPart = parts[0]
        if (tempBeamPart.length >= 4) {
          const tempCode = tempBeamPart.substring(0, 2)
          const beamCode = tempBeamPart.substring(2, 4)

          // 反向查找变量值
          const colorTempValue = await VariableConfigModel.getValueByCode('colorTemperature', tempCode)
          const beamAngleValue = await VariableConfigModel.getValueByCode('beamAngle', beamCode)

          variables.colorTemperature = colorTempValue || undefined
          variables.beamAngle = beamAngleValue || undefined
        }
      }

      if (parts.length >= 2) {
        const appearanceColorValue = await VariableConfigModel.getValueByCode('appearanceColor', parts[1])
        variables.appearanceColor = appearanceColorValue || undefined
      }

      if (parts.length >= 3) {
        const controlMethodValue = await VariableConfigModel.getValueByCode('controlMethod', parts[2])
        variables.controlMethod = controlMethodValue || undefined
      }

      return variables
    } catch (error) {
      console.error('解析型号变量失败:', error)
      return null
    }
  }
}
