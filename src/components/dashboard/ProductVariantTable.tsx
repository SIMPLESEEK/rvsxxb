'use client'

import React, { useState, useEffect } from 'react'
import { ProductVariantSelector } from './ProductVariantSelector'
import { Product, VariableType } from '@/types/product'
import { UserRole } from '@/types/auth'
import { Loader2, Search, Filter } from 'lucide-react'

interface ProductVariantTableProps {
  userRole: UserRole
}

export function ProductVariantTable({ userRole }: ProductVariantTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductType, setSelectedProductType] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    loadProducts()
  }, [searchTerm, selectedProductType, selectedBrand])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      setError('')

      // 使用V2版本的产品API获取包含productVariables的产品数据
      const params = new URLSearchParams()
      params.append('active', 'true')
      if (searchTerm.trim()) params.append('search', searchTerm)
      if (selectedProductType) params.append('productType', selectedProductType)
      if (selectedBrand) params.append('brand', selectedBrand)

      // 根据用户角色选择合适的API端点
      const apiEndpoint = userRole === 'admin' ? '/api/admin/products' : '/api/products'
      const response = await fetch(`${apiEndpoint}?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取产品列表失败')
      }

      const data = await response.json()
      // 只显示有productVariables配置的产品
      const productsWithVariables = (data.products || []).filter((product: Product) =>
        product.productVariables && Object.keys(product.productVariables).length > 0
      )
      setProducts(productsWithVariables)
    } catch (error) {
      console.error('加载基础产品失败:', error)
      setError(error instanceof Error ? error.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToProject = (product: Product, selectedVariables: { [key in VariableType]?: string }) => {
    try {
      // 获取现有的项目清单（从sessionStorage）
      const existingList = JSON.parse(sessionStorage.getItem('projectList') || '[]')

      // 生成完整的产品信息
      const productItem = {
        productId: `${product._id}_${JSON.stringify(selectedVariables)}`,
        product: product,
        selectedVariables: selectedVariables,
        quantity: 1,
        addedAt: new Date().toISOString()
      }

      // 检查是否已存在相同的变量组合
      const existingIndex = existingList.findIndex((item: any) =>
        item.productId === productItem.productId
      )

      let message = ''
      if (existingIndex >= 0) {
        // 如果已存在，增加数量
        existingList[existingIndex].quantity += 1
        message = `${baseProduct.name} (${Object.values(selectedVariables).join(', ')}) 数量已增加到 ${existingList[existingIndex].quantity}`
      } else {
        // 如果不存在，添加新项目
        existingList.push(productItem)
        message = `已将 ${baseProduct.name} (${Object.values(selectedVariables).join(', ')}) 添加到项目清单`
      }

      // 保存到sessionStorage（临时存储）
      sessionStorage.setItem('projectList', JSON.stringify(existingList))

      // 显示成功提示
      showSuccessToast(message)
    } catch (error) {
      console.error('添加到项目清单失败:', error)
      showErrorToast('添加失败，请重试')
    }
  }

  // 简单的+1动画 - 显示在项目清单按钮上
  const showSuccessToast = (message: string) => {
    // 找到项目清单按钮
    const projectListButton = document.querySelector('a[href="/project-list"] button')
    if (!projectListButton) return

    // 获取按钮的位置
    const buttonRect = projectListButton.getBoundingClientRect()

    // 创建+1动画元素
    const plusOne = document.createElement('div')
    plusOne.textContent = '+1'
    plusOne.className = 'fixed text-green-500 font-bold text-lg z-50 pointer-events-none'
    plusOne.style.left = `${buttonRect.left + buttonRect.width / 2 - 10}px`
    plusOne.style.top = `${buttonRect.top + buttonRect.height / 2 - 10}px`
    plusOne.style.transition = 'all 0.8s ease-out'

    document.body.appendChild(plusOne)

    // 动画效果：向上移动并淡出
    setTimeout(() => {
      plusOne.style.transform = 'translateY(-30px)'
      plusOne.style.opacity = '0'
    }, 100)

    // 移除元素
    setTimeout(() => {
      document.body.removeChild(plusOne)
    }, 900)
  }

  const showErrorToast = (message: string) => {
    const toast = document.createElement('div')
    toast.className = 'fixed top-16 right-6 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-300'
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = '0'
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 300)
    }, 3000)
  }

  // 过滤和分页
  const filteredProducts = products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // 重置页码当过滤结果改变时
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedProductType, selectedBrand])

  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">加载产品中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 搜索和过滤器 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索产品名称、型号、类型..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 过滤器 */}
          <div className="flex gap-2">
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="产品类型过滤"
            >
              <option value="">所有类型</option>
              <option value="嵌入式射灯">嵌入式射灯</option>
              <option value="轨道灯">轨道灯</option>
              <option value="面板灯">面板灯</option>
              <option value="筒灯">筒灯</option>
              <option value="线性灯">线性灯</option>
              <option value="投光灯">投光灯</option>
            </select>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="品牌过滤"
            >
              <option value="">所有品牌</option>
              <option value="RVS">RVS</option>
            </select>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* 产品统计 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            共找到 <span className="font-medium text-gray-900">{filteredProducts.length}</span> 个产品
            {paginatedProducts.length > 0 && (
              <>
                ，当前显示第 <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(endIndex, filteredProducts.length)}</span> 个
              </>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="text-sm text-gray-600">
                第 {currentPage} 页，共 {totalPages} 页
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 产品列表 */}
      <div className="space-y-4">
        {paginatedProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <div className="text-gray-400 mb-4">
              <Filter className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedProductType || selectedBrand ? '未找到匹配的产品' : '暂无产品数据'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedProductType || selectedBrand 
                ? '请尝试调整搜索条件或过滤器' 
                : '请联系管理员添加产品数据'
              }
            </p>
          </div>
        ) : (
          paginatedProducts.map((product) => (
            <ProductVariantSelector
              key={product._id}
              product={product}
              onAddToProject={handleAddToProject}
            />
          ))
        )}
      </div>
    </div>
  )
}
