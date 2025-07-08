export interface Product {
  _id?: string
  id?: string
  // 基本信息 - 参考xxbws的列配置
  productType: string        // 产品类型
  brand: string             // 品牌
  model: string             // 产品型号
  modelLink?: string        // 产品型号链接

  // 图片信息 - 参考xxbws的图片列
  images: {
    display?: string        // 产品图
    dimension?: string      // 尺寸图
    accessories?: string    // 配件图
  }

  // 规格参数 - 参考xxbws的规格字段
  specifications: {
    detailed: string        // 详细规格参数
    brief: string          // 简要规格参数
  }

  // 外观信息 - 参考xxbws的外观字段
  appearance: {
    color: string          // 外观颜色
    installation: string   // 安装方式
    cutoutSize?: string    // 开孔尺寸
  }

  // 控制和其他信息
  control: string          // 控制方式
  notes?: string           // 备注 (保留向后兼容)
  productremark?: string   // 产品备注

  // 价格信息 - 参考xxbws的价格字段
  pricing?: {
    unitPrice: number      // 含税单价（出厂价）
    marketPrice?: number   // 市场价（计算字段，unitPrice / 0.4）
    deliveryTime: string   // 预计交货时间
  }

  // 状态和排序
  isActive: boolean        // 是否启用
  isNew: boolean          // 是否新产品
  order: number            // 排序

  // 新增：产品变量选择（V2版本产品管理使用）
  productVariables?: {
    [key in VariableType]?: string[]  // 每个变量类型对应的支持选项列表
  }

  // 动态字段支持
  [key: string]: any

  // 时间戳
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ColumnConfig {
  _id?: string
  id?: string
  key: string
  label: string
  type: 'text' | 'image' | 'number' | 'date' | 'multiline' | 'singleline' | 'variable' | 'generated' | 'action'
  roles: string[]
  width?: string
  bg?: string              // 背景色 - 参考xxbws设计
  order: number
  isVisible: boolean
}

// 参考xxbws的列配置常量
export const PRODUCT_COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'order', label: '显示顺序', type: 'number', bg: '#f0f0f0', width: '3%', roles: ['admin'], order: 0.5, isVisible: true },
  { key: 'productType', label: '产品类型', type: 'text', bg: '#e6f7e6', width: '6%', roles: ['admin', 'user'], order: 1, isVisible: true },
  { key: 'brand', label: '品牌', type: 'text', bg: '#e6f7e6', width: '3%', roles: ['admin', 'user'], order: 2, isVisible: true },
  { key: 'images.display', label: '产品图', type: 'image', bg: '#e6f7e6', width: '6%', roles: ['admin', 'user'], order: 3, isVisible: true },
  { key: 'images.dimension', label: '尺寸图', type: 'image', bg: '#e6f7e6', width: '6%', roles: ['admin', 'user'], order: 4, isVisible: true },
  { key: 'images.accessories', label: '配件图', type: 'image', bg: '#e6f7e6', width: '6%', roles: ['admin', 'user'], order: 5, isVisible: true },
  { key: 'specifications.detailed', label: '技术参数', type: 'multiline', bg: '#e6f7e6', width: '20%', roles: ['admin', 'user'], order: 6, isVisible: true },
  { key: 'specifications.brief', label: '简要规格参数', type: 'singleline', bg: '#e6f7e6', width: '15%', roles: ['admin', 'user'], order: 7, isVisible: true },
  { key: 'appearance.color', label: '外观颜色', type: 'text', bg: '#e6f7e6', width: '4%', roles: ['admin', 'user'], order: 8, isVisible: true },
  { key: 'appearance.installation', label: '安装方式', type: 'text', bg: '#e6f7e6', width: '5%', roles: ['admin', 'user'], order: 9, isVisible: true },
  { key: 'appearance.cutoutSize', label: '开孔尺寸', type: 'text', bg: '#e6f7e6', width: '4%', roles: ['admin', 'user'], order: 10, isVisible: true },
  { key: 'control', label: '控制方式', type: 'text', bg: '#e6f7e6', width: '6%', roles: ['admin', 'user'], order: 11, isVisible: true },
  { key: 'productremark', label: '产品备注', type: 'text', bg: '#e6f7e6', width: '7%', roles: ['admin', 'user'], order: 12, isVisible: true },
  { key: 'model', label: '产品型号', type: 'text', bg: '#e6f7e6', width: '5%', roles: ['admin', 'user'], order: 13, isVisible: true },
  { key: 'pricing.unitPrice', label: '含税单价', type: 'number', bg: '#ffe7c2', width: '3%', roles: ['admin'], order: 14, isVisible: true },
  { key: 'pricing.deliveryTime', label: '预计交货时间', type: 'text', bg: '#ffe7c2', width: '4%', roles: ['admin'], order: 15, isVisible: true },
]

// 图片列标识
export const IMAGE_COLUMNS = ['images.display', 'images.dimension', 'images.accessories']

// 多行文本列标识
export const MULTILINE_COLUMNS = ['specifications.detailed']

// 单行文本列标识
export const SINGLELINE_COLUMNS = ['specifications.brief']

// ===== 新增：产品变量系统相关类型定义 =====

// 变量类型枚举
// 注意：添加新的变量类型时，需要同时更新此类型定义
// 新增的变量类型会自动在列配置中创建对应的列
export type VariableType = 'colorTemperature' | 'beamAngle' | 'appearanceColor' | 'controlMethod'

// 变量选项接口
export interface VariableOption {
  _id?: string
  value: string           // 显示值，如 "3000K", "24°", "白色", "DALI"
  code: string           // 编码值，如 "30", "24", "W", "D"
  isDefault?: boolean    // 是否为默认选项
  order: number          // 排序
}

// 变量配置接口
export interface VariableConfig {
  _id?: string
  type: VariableType     // 变量类型
  label: string          // 显示标签，如 "色温", "光束角"
  options: VariableOption[]  // 可选项列表
  isRequired: boolean    // 是否必选
  allowMultiple: boolean // 是否允许多选（暂时保留，当前实现为单选）
  order: number          // 显示顺序
  isActive: boolean      // 是否启用
  createdAt: Date | string
  updatedAt: Date | string
}

// 产品变量组合接口
export interface ProductVariant {
  _id?: string
  baseProductId: string  // 基础产品ID
  variables: {           // 变量选择
    [key in VariableType]?: string  // 变量类型 -> 选项值
  }
  generatedModel: string // 生成的完整型号
  isActive: boolean      // 是否启用
  order: number          // 排序（基于基础产品order + 小数）
  createdAt: Date | string
  updatedAt: Date | string
}

// 基础产品接口（用于存储不包含变量的基础信息）
export interface BaseProduct {
  _id?: string
  productType: string
  brand: string
  baseModel: string      // 基础型号，如 "RDU-T55"
  name: string           // 产品名称
  images: {
    display?: string
    dimension?: string
    accessories?: string
  }
  specifications: {
    detailed: string     // 基础规格模板，使用占位符如 {{colorTemperature}}, {{beamAngle}}
    brief: string        // 基础简要规格模板
  }
  appearance: {
    color?: string       // 基础外观颜色（如果不作为变量）
    installation: string
    cutoutSize?: string
  }
  control?: string       // 基础控制方式（如果不作为变量）
  notes?: string         // 基础备注模板
  pricing?: {
    unitPrice: number
    deliveryTime: string
  }
  // 变量配置
  enabledVariables: VariableType[]  // 启用的变量类型
  modelGenerationRule?: string      // 型号生成规则模板

  isActive: boolean
  isNew: boolean
  order: number
  createdAt: Date | string
  updatedAt: Date | string
}

// 产品型号生成规则配置
export interface ModelGenerationRule {
  _id?: string
  name: string           // 规则名称
  description: string    // 规则描述
  template: string       // 模板，如 "{baseModel}-{colorTemp}{beamAngle}-{appearance}-{control}"
  variableMapping: {     // 变量映射规则
    [key in VariableType]?: {
      extractPattern: string    // 提取模式，如从 "3000K" 提取 "30"
      codeLength?: number       // 代码长度，如光束角统一为2位
      padChar?: string          // 填充字符
    }
  }
  isDefault: boolean     // 是否为默认规则
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}
