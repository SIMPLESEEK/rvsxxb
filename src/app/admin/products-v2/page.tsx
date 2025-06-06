'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit3, Trash2, Move, Save, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ImageThumbnail } from '@/components/ui/ImageThumbnail'
import { DynamicProductForm } from '@/components/admin/DynamicProductForm'
import { ProductSortManager } from '@/components/admin/ProductSortManager'

interface Product {
  _id: string
  model: string
  productType: string
  brand: string
  images: {
    display?: string
    dimension?: string
    accessories?: string
  }
  specifications: {
    detailed: string
    brief: string
  }
  appearance: {
    color: string
    installation: string
    cutoutSize?: string
  }
  control: string
  notes?: string
  pricing?: {
    unitPrice: number
    deliveryTime: string
  }
  order: number
  isActive: boolean
  isNew: boolean
  createdAt: string
  updatedAt: string
  [key: string]: any // 支持动态字段
}

export default function ProductsV2Page() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showSortManager, setShowSortManager] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载产品数据
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('获取产品列表失败')
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('加载产品失败:', error)
      setError(error instanceof Error ? error.message : '加载产品失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickEdit = () => {
    if (!selectedProductId.trim()) {
      alert('请输入产品ID或型号')
      return
    }

    // 根据ID或型号查找产品
    const product = products.find(p =>
      p._id === selectedProductId ||
      p.model.toLowerCase() === selectedProductId.toLowerCase()
    )

    if (!product) {
      alert('未找到指定的产品')
      return
    }

    setEditingProduct(product)
  }

  const handleAddProduct = () => {
    setShowAddForm(true)
  }

  const handleSaveProduct = async (productData: any) => {
    setIsLoading(true)
    try {
      const url = editingProduct
        ? '/api/admin/products'
        : '/api/admin/products'

      const method = editingProduct ? 'PUT' : 'POST'
      const payload = editingProduct
        ? { id: editingProduct._id, ...productData }
        : productData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('保存产品失败')
      }

      // 重新加载产品列表
      await loadProducts()

      // 关闭表单
      setShowAddForm(false)
      setEditingProduct(null)
      setSelectedProductId('')

      alert(editingProduct ? '产品更新成功' : '产品添加成功')
    } catch (error) {
      console.error('保存产品失败:', error)
      alert(error instanceof Error ? error.message : '保存产品失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('删除产品失败')
      }

      await loadProducts()
      alert('产品删除成功')
    } catch (error) {
      console.error('删除产品失败:', error)
      alert(error instanceof Error ? error.message : '删除产品失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
  }

  const handleSortProducts = async (sortedProducts: any[]) => {
    setIsLoading(true)
    try {
      // 批量更新产品排序
      for (const product of sortedProducts) {
        await fetch('/api/admin/products', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            id: product._id,
            order: product.order
          })
        })
      }

      // 重新加载产品列表
      await loadProducts()
      setShowSortManager(false)
      alert('产品排序更新成功')
    } catch (error) {
      console.error('更新排序失败:', error)
      alert('更新排序失败')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">产品管理 V2</h1>
              <p className="text-sm text-gray-600 mt-1">快速、高效的产品管理界面</p>
            </div>
            <Button
              onClick={handleAddProduct}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              添加产品
            </Button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadProducts}
              className="ml-auto"
            >
              重试
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 左侧：快速操作面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              
              {/* 快速搜索 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 快速定位</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索产品名称、型号..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 快速编辑 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ 快速编辑</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="输入产品ID (如: TEST-001)"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button onClick={handleQuickEdit} size="sm" className="flex items-center gap-1">
                      <Edit3 className="h-4 w-4" />
                      编辑
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 提示：输入产品型号可快速定位并编辑产品
                  </p>
                </div>
              </div>

              {/* 批量操作 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 批量操作</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setShowSortManager(true)}
                    disabled={isLoading || products.length === 0}
                  >
                    <Move className="h-4 w-4" />
                    排序
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Trash2 className="h-4 w-4" />
                    删除
                  </Button>
                </div>
              </div>

              {/* 统计信息 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 统计信息</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">总产品数:</span>
                    <span className="font-medium">{products.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">启用产品:</span>
                    <span className="font-medium text-green-600">
                      {products.filter(p => p.isActive).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">禁用产品:</span>
                    <span className="font-medium text-red-600">
                      {products.filter(p => !p.isActive).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">搜索结果:</span>
                    <span className="font-medium text-blue-600">
                      {filteredProducts.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：产品预览 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">产品预览</h3>
                <p className="text-sm text-gray-600 mt-1">
                  与产品选型表保持一致的显示风格
                </p>
              </div>
              
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">加载中...</p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredProducts.map((product) => (
                      <div key={product._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          {/* 产品图片 */}
                          <div className="flex-shrink-0">
                            <ImageThumbnail
                              src={product.images.display || ''}
                              alt={product.name}
                              thumbnailClassName="w-16 h-16"
                              lazy={false}
                            />
                          </div>

                          {/* 产品信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {product.model}
                              </span>
                              {product.isNew && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                  NEW
                                </span>
                              )}
                              {!product.isActive && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  已禁用
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {product.productType} • {product.brand}
                            </p>
                            <p className="text-xs text-gray-500">
                              排序: {product.order} • ID: {product._id.slice(-6)}
                            </p>
                            {product.pricing && (
                              <p className="text-xs text-green-600">
                                ¥{product.pricing.unitPrice} • {product.pricing.deliveryTime}
                              </p>
                            )}
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                              onClick={() => handleEditProduct(product)}
                              disabled={isLoading}
                            >
                              <Edit3 className="h-3 w-3" />
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteProduct(product._id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-3 w-3" />
                              删除
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      {searchTerm ? <Search className="h-12 w-12 mx-auto" /> : <Plus className="h-12 w-12 mx-auto" />}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? '未找到匹配的产品' : '暂无产品'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? '尝试调整搜索条件' : '开始添加您的第一个产品'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={handleAddProduct} disabled={isLoading}>
                        添加产品
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 产品表单弹窗 */}
      {(showAddForm || editingProduct) && (
        <DynamicProductForm
          product={editingProduct}
          onSubmit={handleSaveProduct}
          onCancel={() => {
            setShowAddForm(false)
            setEditingProduct(null)
          }}
          isLoading={isLoading}
        />
      )}

      {/* 排序管理弹窗 */}
      {showSortManager && (
        <ProductSortManager
          products={products}
          onSave={handleSortProducts}
          onCancel={() => setShowSortManager(false)}
        />
      )}
    </div>
  )
}
