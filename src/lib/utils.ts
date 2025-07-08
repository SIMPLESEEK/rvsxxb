import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

// 计算市场价格（含税价格除以40%）
export function calculateMarketPrice(unitPrice: number): number {
  return Math.round((unitPrice / 0.4) * 100) / 100
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    return new Promise((resolve, reject) => {
      if (document.execCommand('copy')) {
        resolve()
      } else {
        reject(new Error('复制失败'))
      }
      document.body.removeChild(textArea)
    })
  }
}

export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    }
    return current[key]
  }, obj)
  target[lastKey] = value
}

/**
 * 判断是否应该显示价格
 * @param controlMethod 控制方式参数值
 * @returns 如果是 'Onoff' 返回 true，其他返回 false
 */
export function shouldShowPrice(controlMethod?: string): boolean {
  // 支持多种Onoff的表示方式，包括可能的大小写变化
  if (!controlMethod) return false

  // 标准化处理：转换为小写并移除特殊字符
  const normalizedMethod = controlMethod.toLowerCase().replace(/[^a-z0-9]/g, '')

  // 支持的Onoff格式
  const onoffVariants = [
    'onoff',
    'on/off',
    'ON/OFF',
    'ONOFF',
    'Onoff',
    'OnOff',
    'on-off',
    'ON-OFF'
  ]

  // 检查原始值
  if (onoffVariants.includes(controlMethod)) {
    return true
  }

  // 检查标准化后的值
  return normalizedMethod === 'onoff'
}

/**
 * 获取价格显示内容
 * @param price 价格数值
 * @param controlMethod 控制方式参数值
 * @param showFactoryPrice 是否显示含税价格（true）还是市场价格（false）
 * @returns 价格字符串或提示文本
 */
export function getPriceDisplay(price: number, controlMethod?: string, showFactoryPrice: boolean = true): string {
  if (!shouldShowPrice(controlMethod)) {
    return '当前系统仅支持显示Onoff产品价格，调光产品价格请咨询销售人员'
  }

  if (!price || price <= 0) {
    return '价格待定'
  }

  const displayPrice = showFactoryPrice ? price : (price / 0.4)
  return `￥${displayPrice.toFixed(2)}`
}


