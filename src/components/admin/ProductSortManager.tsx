'use client'

import React, { useState } from 'react'
import { Move, Save, X, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Product {
  _id: string
  name: string
  model: string
  order: number
}

interface ProductSortManagerProps {
  products: Product[]
  onSave: (sortedProducts: Product[]) => void
  onCancel: () => void
}

export function ProductSortManager({ products, onSave, onCancel }: ProductSortManagerProps) {
  const [sortedProducts, setSortedProducts] = useState(
    [...products].sort((a, b) => a.order - b.order)
  )

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...sortedProducts]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < newProducts.length) {
      // 交换位置
      [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]]
      
      // 更新order值
      newProducts.forEach((product, idx) => {
        product.order = idx + 1
      })
      
      setSortedProducts(newProducts)
    }
  }

  const updateOrder = (productId: string, newOrder: number) => {
    const newProducts = [...sortedProducts]
    const productIndex = newProducts.findIndex(p => p._id === productId)
    
    if (productIndex !== -1 && newOrder > 0 && newOrder <= newProducts.length) {
      newProducts[productIndex].order = newOrder
      
      // 重新排序
      newProducts.sort((a, b) => a.order - b.order)
      
      // 重新分配连续的order值
      newProducts.forEach((product, idx) => {
        product.order = idx + 1
      })
      
      setSortedProducts(newProducts)
    }
  }

  const handleSave = () => {
    onSave(sortedProducts)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">产品排序管理</h2>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-3">
            {sortedProducts.map((product, index) => (
              <div key={product._id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                {/* 排序号 */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={sortedProducts.length}
                    value={product.order}
                    onChange={(e) => updateOrder(product._id, parseInt(e.target.value))}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                  />
                </div>

                {/* 产品信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {product.name}
                    </span>
                    <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                      {product.model}
                    </span>
                  </div>
                </div>

                {/* 移动按钮 */}
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveProduct(index, 'up')}
                    disabled={index === 0}
                    className="p-1 h-8 w-8"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveProduct(index, 'down')}
                    disabled={index === sortedProducts.length - 1}
                    className="p-1 h-8 w-8"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* 说明 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">排序说明</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 数字越小，产品在选型表中的位置越靠前</li>
              <li>• 可以直接修改排序号，或使用上下箭头调整</li>
              <li>• 排序号会自动调整为连续数字</li>
              <li>• 点击保存后，新的排序将应用到产品选型表</li>
            </ul>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            保存排序
          </Button>
        </div>
      </div>
    </div>
  )
}
