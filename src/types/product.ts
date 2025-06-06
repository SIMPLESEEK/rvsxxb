export interface Product {
  _id?: string
  id?: string
  // 基本信息 - 参考xxbws的列配置
  productType: string        // 产品类型
  brand: string             // 品牌
  model: string             // 产品型号

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
  notes?: string           // 备注

  // 价格信息 - 参考xxbws的价格字段
  pricing?: {
    unitPrice: number      // 含税单价
    deliveryTime: string   // 预计交货时间
  }

  // 状态和排序
  isActive: boolean        // 是否启用
  isNew: boolean          // 是否新产品
  order: number            // 排序

  // 动态字段支持
  [key: string]: any

  // 时间戳
  createdAt: Date
  updatedAt: Date
}

export interface ColumnConfig {
  _id?: string
  id?: string
  key: string
  label: string
  type: 'text' | 'image' | 'number' | 'date' | 'multiline' | 'singleline'
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
  { key: 'specifications.detailed', label: '详细规格参数', type: 'multiline', bg: '#e6f7e6', width: '20%', roles: ['admin', 'user'], order: 6, isVisible: true },
  { key: 'specifications.brief', label: '简要规格参数', type: 'singleline', bg: '#e6f7e6', width: '15%', roles: ['admin', 'user'], order: 7, isVisible: true },
  { key: 'appearance.color', label: '外观颜色', type: 'text', bg: '#e6f7e6', width: '4%', roles: ['admin', 'user'], order: 8, isVisible: true },
  { key: 'appearance.installation', label: '安装方式', type: 'text', bg: '#e6f7e6', width: '5%', roles: ['admin', 'user'], order: 9, isVisible: true },
  { key: 'appearance.cutoutSize', label: '开孔尺寸', type: 'text', bg: '#e6f7e6', width: '4%', roles: ['admin', 'user'], order: 10, isVisible: true },
  { key: 'control', label: '控制方式', type: 'text', bg: '#e6f7e6', width: '6%', roles: ['admin', 'user'], order: 11, isVisible: true },
  { key: 'notes', label: '备注', type: 'text', bg: '#e6f7e6', width: '7%', roles: ['admin', 'user'], order: 12, isVisible: true },
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
