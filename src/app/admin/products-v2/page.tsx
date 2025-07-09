'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit3, Trash2, RefreshCw, AlertCircle, CheckSquare, Square, BarChart3, Home, Settings, Columns, Loader2, Package, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ImageThumbnail } from '@/components/ui/ImageThumbnail'
import { DynamicProductForm } from '@/components/admin/DynamicProductForm'
import { CopyableCell } from '@/components/ui/CopyableCell'
import { ProductTypeFilter } from '@/components/ui/ProductTypeFilter'
import { useAuth } from '@/providers/AuthProvider'

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
  [key: string]: unknown
}

export default function ProductsV2Page() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductType, setSelectedProductType] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // 权限检查
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/product-list-v3')
    }
  }, [user, authLoading, router])

  // 过滤产品
  const filteredProducts = products.filter(product => {
    // 首先应用搜索筛选
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = (
        product.model.toLowerCase().includes(searchLower) ||
        product.productType.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower)
      )
      if (!matchesSearch) return false
    }

    // 然后应用产品类型筛选
    if (selectedProductType && product.productType !== selectedProductType) return false

    return true
  })

  // 分页计算
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // 重置页码当过滤结果改变时
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedProductType, filteredProducts.length])

  const loadProducts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/products', {
        credentials: 'include'
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
  }

  const handleSaveProduct = async (productData: Record<string, unknown>) => {
    setIsLoading(true)
    try {
      const isEditing = !!editingProduct
      const url = '/api/admin/products'
      const method = isEditing ? 'PUT' : 'POST'

      const payload = isEditing && editingProduct
        ? { id: editingProduct._id, ...productData }
        : productData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(isEditing ? '更新产品失败' : '创建产品失败')
      }

      await loadProducts()
      setEditingProduct(null)
      setShowAddForm(false)
      alert(isEditing ? '产品更新成功' : '产品创建成功')
    } catch (error) {
      console.error('保存产品失败:', error)
      alert(error instanceof Error ? error.message : '保存产品失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？此操作不可恢复。')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/products?id=' + productId, {
        method: 'DELETE',
        credentials: 'include'
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



  const handleBatchDelete = async () => {
    if (selectedProducts.length === 0) {
      alert('请先选择要删除的产品')
      return
    }

    if (!confirm('确定要删除选中的 ' + selectedProducts.length + ' 个产品吗？此操作不可恢复。')) {
      return
    }

    setIsLoading(true)
    try {
      const deletePromises = selectedProducts.map(productId =>
        fetch('/api/admin/products?id=' + productId, {
          method: 'DELETE',
          credentials: 'include'
        })
      )

      const results = await Promise.all(deletePromises)
      const failedDeletes = results.filter(response => !response.ok)

      if (failedDeletes.length > 0) {
        throw new Error('部分产品删除失败')
      }

      await loadProducts()
      setSelectedProducts([])
      setIsSelectMode(false)
      alert('成功删除 ' + selectedProducts.length + ' 个产品')
    } catch (error) {
      console.error('批量删除失败:', error)
      alert(error instanceof Error ? error.message : '批量删除失败')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedProducts([])
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p._id))
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // 加载状态
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      </div>
    )
  }

  // 权限检查
  if (!user || user.role !== 'admin') {
    return null
  }

  return (
      <div className="min-h-screen bg-gray-50">
      {/* 页眉区域 */}
      <div className="bg-white shadow-sm border-b admin-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/product-list-v3')}
                  className="flex items-center gap-2 mr-4"
                >
                  <Home className="h-4 w-4" />
                  返回产品选型表
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Package className="h-8 w-8 text-blue-600" />
                    产品管理 V2
                  </h1>
                  <p className="mt-2 text-gray-600">
                    支持产品变量配置的新版产品管理
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/product-model-settings')}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  变量设置
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/columns')}
                  className="flex items-center gap-2"
                >
                  <Columns className="h-4 w-4" />
                  列设置
                </Button>
                <Button
                  variant="outline"
                  onClick={loadProducts}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? '刷新中...' : '刷新数据'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddProduct}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  添加产品
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/data-cleanup')}
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  数据清理
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="搜索产品型号、类型、品牌、规格等..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="输入产品ID或型号快速编辑"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  variant="outline"
                  onClick={handleQuickEdit}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Edit3 className="h-4 w-4" />
                  快速编辑
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                共找到 {filteredProducts.length} 个产品
                {isSelectMode && selectedProducts.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    已选择 {selectedProducts.length} 个产品
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isSelectMode && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllProducts}
                      className="flex items-center gap-1"
                    >
                      {selectedProducts.length === filteredProducts.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      {selectedProducts.length === filteredProducts.length ? '取消全选' : '全选'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBatchDelete}
                      disabled={selectedProducts.length === 0 || isLoading}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      删除选中 ({selectedProducts.length})
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-1 ${isSelectMode ? 'bg-blue-50 text-blue-700 border-blue-300' : ''}`}
                  onClick={toggleSelectMode}
                  disabled={isLoading || products.length === 0}
                >
                  <CheckSquare className="h-4 w-4" />
                  {isSelectMode ? '取消选择' : '批量删除'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={loadProducts} disabled={isLoading}>
                      重新加载
                    </Button>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">加载中...</p>
                  </div>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div>
                  {/* 统计信息 - 紧凑布局 */}
                  <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">统计</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">总数:</span>
                          <span className="font-medium text-gray-900">{products.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">启用:</span>
                          <span className="font-medium text-green-600">{filteredProducts.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">新品:</span>
                          <span className="font-medium text-red-600">{products.filter(p => p.isNew).length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">当前:</span>
                          <span className="font-medium text-blue-600">{paginatedProducts.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      第 {currentPage} 页，共 {Math.ceil(filteredProducts.length / itemsPerPage)} 页
                    </div>
                  </div>

                  {/* 产品类型筛选 */}
                  <ProductTypeFilter
                    products={products}
                    selectedType={selectedProductType}
                    onTypeChange={setSelectedProductType}
                    className="mb-4"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {paginatedProducts.map((product) => (
                      <div
                        key={product._id}
                        className={`
                          relative border rounded-lg p-3 transition-all duration-200 cursor-pointer
                          ${selectedProducts.includes(product._id)
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          }
                        `}
                        onClick={() => isSelectMode && toggleProductSelection(product._id)}
                      >
                        {/* 选择框 */}
                        {isSelectMode && (
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={() => toggleProductSelection(product._id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`选择产品 ${product.model}`}
                              title={`选择产品 ${product.model}`}
                            />
                          </div>
                        )}

                        {/* NEW 标签 */}
                        {product.isNew && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              NEW
                            </span>
                          </div>
                        )}

                        {/* 产品图片 */}
                        <div className="flex justify-center mb-3">
                          <ImageThumbnail
                            src={product.images?.display || ''}
                            alt={product.model}
                            thumbnailClassName="w-16 h-16"
                          />
                        </div>

                        {/* 产品信息 */}
                        <div className="text-center space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            <CopyableCell
                              value={product.model}
                              className="text-center text-sm font-medium text-gray-900 truncate"
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            <CopyableCell
                              value={product.productType}
                              className="text-center text-xs text-gray-500 truncate"
                            />
                          </div>
                          <div className="text-xs font-medium text-green-600">
                            <CopyableCell
                              value={`¥${product.pricing?.unitPrice?.toFixed(2) || '0.00'}`}
                              className="text-center text-xs font-medium text-green-600"
                            />
                          </div>
                          {/* 产品唯一识别代码 */}
                          <div className="text-xs text-gray-400 font-mono">
                            <CopyableCell
                              value={`ID: ${product._id.slice(-6)}`}
                              className="text-center text-xs text-gray-400 font-mono truncate"
                            />
                          </div>
                          {/* 显示顺序 */}
                          <div className="text-xs text-blue-500 font-medium">
                            <CopyableCell
                              value={`顺序: ${product.order}`}
                              className="text-center text-xs text-blue-500 font-medium"
                            />
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex justify-center gap-2 mt-3 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditProduct(product)
                            }}
                            className="flex-1 p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors text-xs font-medium"
                            title="编辑产品"
                          >
                            <Edit3 className="h-4 w-4 mx-auto" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteProduct(product._id)
                            }}
                            className="flex-1 p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors text-xs font-medium"
                            title="删除产品"
                          >
                            <Trash2 className="h-4 w-4 mx-auto" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredProducts.length > itemsPerPage && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        显示 {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} 项，共 {filteredProducts.length} 项
                      </div>

                      <div className="flex items-center space-x-2">
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value))
                            setCurrentPage(1)
                          }}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                          aria-label="每页显示数量"
                        >
                          <option value={10}>10/页</option>
                          <option value={20}>20/页</option>
                          <option value={50}>50/页</option>
                          <option value={100}>100/页</option>
                        </select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          上一页
                        </Button>

                        <span className="px-3 py-1 text-sm">
                          第 {currentPage} 页，共 {totalPages} 页
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">没有找到匹配的产品</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(showAddForm || editingProduct) && (
        <DynamicProductForm
          product={editingProduct}
          onSubmit={handleSaveProduct}
          onCancel={() => {
            setEditingProduct(null)
            setShowAddForm(false)
          }}
          isLoading={isLoading}
        />
      )}
      </div>
  )
}
