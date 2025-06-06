'use client'

import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { CopyableCell } from '@/components/ui/CopyableCell'
import { ImageThumbnail } from '@/components/ui/ImageThumbnail'
import { getNestedValue, formatPrice } from '@/lib/utils'
import { Product, ColumnConfig } from '@/types/product'
import { UserRole } from '@/types/auth'
import { Loader2, Search } from 'lucide-react'

interface ProductTableProps {
  userRole: UserRole
}

export function ProductTable({ userRole }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [columns, setColumns] = useState<ColumnConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/products', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取产品数据失败')
      }

      const data = await response.json()
      setProducts(data.products || [])
      setColumns(data.columns || [])
    } catch (error: any) {
      setError(error.message || '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.brand?.toLowerCase().includes(searchLower) ||
      product.model?.toLowerCase().includes(searchLower) ||
      product.productType?.toLowerCase().includes(searchLower)
    )
  })

  const renderCell = (product: Product, column: ColumnConfig) => {
    const value = getNestedValue(product, column.key)

    if (!value && value !== 0) {
      return <span className="text-gray-400">-</span>
    }

    switch (column.type) {
      case 'image':
        return (
          <div className="image-cell">
            <ImageThumbnail
              key={`${product._id || product.id}-${column.key}-${value}`}
              src={value || ''}
              alt={`${product.name} - ${column.label}`}
              thumbnailClassName="w-14 h-14"
              lazy={false}
            />
          </div>
        )

      case 'multiline':
        return (
          <div className="w-full">
            <div className="multiline-cell">
              <CopyableCell value={value.toString()} />
            </div>
          </div>
        )

      case 'singleline':
        return (
          <div className="w-full">
            <div className="singleline-cell">
              <CopyableCell value={value.toString()} />
            </div>
          </div>
        )

      case 'number':
        if (column.key.includes('price')) {
          return <CopyableCell value={formatPrice(value)} />
        }
        return <CopyableCell value={value.toString()} />

      case 'text':
      default:
        // 特殊处理产品型号列，显示NEW标记
        if (column.key === 'model' && product.isNew) {
          return (
            <div className="w-full">
              <div className="singleline-cell flex items-center gap-1">
                <CopyableCell value={value.toString()} />
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                  NEW
                </span>
              </div>
            </div>
          )
        }
        return (
          <div className="w-full">
            <div className="singleline-cell">
              <CopyableCell value={value.toString()} />
            </div>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={fetchProducts}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="搜索产品名称、品牌、型号..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 产品表格 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table className="product-table responsive-table compact-table">
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => {
                  // 判断是否为窄列 - 图片列不应用窄列样式
                  const widthValue = parseFloat(column.width || '0')
                  const isImageColumn = column.type === 'image'
                  const isUltraNarrow = !isImageColumn && widthValue <= 3
                  const isNarrow = !isImageColumn && widthValue > 3 && widthValue < 6

                  return (
                    <TableHead
                      key={column.key}
                      style={{
                        width: column.width,
                        minWidth: column.width,
                        maxWidth: column.width
                      }}
                      className={`bg-gray-50 font-semibold text-xs ${
                        isImageColumn ? 'image-column-cell' :
                        isUltraNarrow ? 'ultra-narrow-column' :
                        isNarrow ? 'narrow-column' : 'px-1 py-2'
                      } ${index > 3 ? 'mobile-priority-low' : ''}`}
                    >
                      <div className="break-words" title={column.label}>
                        {column.label}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-500"
                >
                  {searchTerm ? '未找到匹配的产品' : '暂无产品数据'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product._id || product.id} className="hover:bg-gray-50">
                  {columns.map((column, index) => {
                    // 判断是否为窄列 - 图片列不应用窄列样式
                    const widthValue = parseFloat(column.width || '0')
                    const isImageColumn = column.type === 'image'
                    const isUltraNarrow = !isImageColumn && widthValue <= 3
                    const isNarrow = !isImageColumn && widthValue > 3 && widthValue < 6

                    return (
                      <TableCell
                        key={column.key}
                        style={{
                          width: column.width,
                          minWidth: column.width,
                          maxWidth: column.width
                        }}
                        className={`text-xs ${
                          isImageColumn ? 'image-column-cell' :
                          isUltraNarrow ? 'ultra-narrow-column' :
                          isNarrow ? 'narrow-column' : 'px-1 py-2'
                        } ${index > 3 ? 'mobile-priority-low' : ''}`}
                      >
                        {renderCell(product, column)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="text-sm text-gray-600 text-center">
        显示 {filteredProducts.length} / {products.length} 个产品
      </div>
    </div>
  )
}
