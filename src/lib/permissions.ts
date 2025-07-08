import { UserRole } from '@/types/auth'

export const PERMISSIONS = {
  // 产品查看权限
  VIEW_PRODUCTS: ['user', 'dealer', 'admin'],
  VIEW_PRICES: ['dealer', 'admin'],
  VIEW_DELIVERY_TIME: ['dealer', 'admin'],

  // 管理权限
  MANAGE_USERS: ['admin'],
  MANAGE_PRODUCTS: ['admin'],
  MANAGE_COLUMNS: ['admin'],
  UPLOAD_FILES: ['admin'],

  // 报价单权限
  CREATE_QUOTATIONS: ['user', 'dealer', 'admin'],
  MANAGE_TEMPLATES: ['user', 'dealer', 'admin'],
  VIEW_COST_INFO: ['admin'], // 成本信息只有管理员能看
} as const

export function hasPermission(userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(userRole)
}

export function canViewColumn(userRole: UserRole, columnRoles: string[]): boolean {
  return columnRoles.includes(userRole)
}

export function getVisibleColumns(userRole: UserRole, allColumns: any[]): any[] {
  return allColumns.filter(column => canViewColumn(userRole, column.roles))
}

export function filterProductData(userRole: UserRole, product: any, visibleColumns: any[]): any {
  const filtered: any = {}
  
  visibleColumns.forEach(column => {
    const keys = column.key.split('.')
    let value = product
    
    // 获取嵌套属性值
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key]
      } else {
        value = undefined
        break
      }
    }
    
    // 设置到过滤后的对象中
    if (keys.length === 1) {
      filtered[keys[0]] = value
    } else {
      // 处理嵌套对象
      let current = filtered
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
    }
  })
  
  // 始终包含ID和状态字段
  filtered._id = product._id
  filtered.id = product.id || product._id
  filtered.isNew = product.isNew
  filtered.isActive = product.isActive

  return filtered
}
