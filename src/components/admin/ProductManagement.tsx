'use client'

import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { ProductForm } from './ProductForm'
import { Product } from '@/types/product'
import { formatDate, formatPrice } from '@/lib/utils'
import { Loader2, Plus, Edit, Trash2, Search } from 'lucide-react'

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/products', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取产品列表失败')
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (error: any) {
      setError(error.message || '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (productData: any) => {
    try {
      setIsSubmitting(true)
      
      const isEditing = !!productData.id
      const url = '/api/admin/products'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }

      await fetchProducts()
      setShowForm(false)
      setEditingProduct(null)

    } catch (error: any) {
      alert(error.message || '操作失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`确定要删除产品 "${product.name}" 吗？`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products?id=${product._id || product.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '删除失败')
      }

      await fetchProducts()
    } catch (error: any) {
      alert(error.message || '删除失败')
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
        <Button onClick={fetchProducts} className="mt-4">
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">产品管理</h3>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchProducts} variant="outline" size="sm">
            刷新
          </Button>
          <Button 
            onClick={() => {
              setEditingProduct(null)
              setShowForm(true)
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加产品
          </Button>
        </div>
      </div>

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>产品名称</TableHead>
              <TableHead>品牌</TableHead>
              <TableHead>型号</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={8} 
                  className="text-center py-8 text-gray-500"
                >
                  {searchTerm ? '未找到匹配的产品' : '暂无产品数据'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product._id || product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.brand || '-'}</TableCell>
                  <TableCell>{product.model}</TableCell>
                  <TableCell>{product.productType}</TableCell>
                  <TableCell>
                    {product.pricing?.unitPrice ? 
                      formatPrice(product.pricing.unitPrice) : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.isActive ? '启用' : '禁用'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(product.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-600">
        显示 {filteredProducts.length} / {products.length} 个产品
      </div>

      {/* 产品表单模态框 */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingProduct(null)
          }}
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}
