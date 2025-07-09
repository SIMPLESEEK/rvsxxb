'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Package } from 'lucide-react'

interface ProductTypeFilterProps {
  products: any[]
  selectedType: string
  onTypeChange: (type: string) => void
  className?: string
}

export function ProductTypeFilter({ 
  products, 
  selectedType, 
  onTypeChange, 
  className = '' 
}: ProductTypeFilterProps) {
  const [productTypes, setProductTypes] = useState<Array<{ type: string; count: number }>>([])

  // 从产品列表中提取产品类型和统计数量
  useEffect(() => {
    const typeMap = new Map<string, number>()
    
    products.forEach(product => {
      if (product.productType) {
        const type = product.productType.trim()
        typeMap.set(type, (typeMap.get(type) || 0) + 1)
      }
    })

    // 转换为数组并按产品数量降序排序
    const types = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    setProductTypes(types)
  }, [products])

  // 计算总产品数量
  const totalCount = products.length

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-medium text-gray-900">按产品类型筛选</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* 全部按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTypeChange('')}
          className={`text-xs transition-all duration-200 ${
            selectedType === ''
              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md'
              : 'hover:bg-gray-50'
          }`}
        >
          全部
          <span className={`ml-1 text-xs ${selectedType === '' ? 'opacity-90' : 'opacity-75'}`}>
            ({totalCount})
          </span>
        </Button>

        {/* 产品类型按钮 */}
        {productTypes.map(({ type, count }) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => onTypeChange(type)}
            className={`text-xs transition-all duration-200 ${
              selectedType === type
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md'
                : 'hover:bg-gray-50'
            }`}
          >
            {type}
            <span className={`ml-1 text-xs ${selectedType === type ? 'opacity-90' : 'opacity-75'}`}>
              ({count})
            </span>
          </Button>
        ))}
      </div>

      {/* 当前筛选状态提示 */}
      {selectedType && (
        <div className="mt-3 text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-md">
          当前显示：<span className="font-medium text-blue-700">{selectedType}</span> 类型的产品
          {productTypes.find(t => t.type === selectedType) && (
            <span className="ml-1">
              (共 {productTypes.find(t => t.type === selectedType)?.count} 个)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
