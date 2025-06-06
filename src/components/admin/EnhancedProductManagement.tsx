'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Product, PRODUCT_COLUMN_CONFIG, IMAGE_COLUMNS, MULTILINE_COLUMNS, SINGLELINE_COLUMNS } from '@/types/product'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Loader2, Plus, Search } from 'lucide-react'

interface EnhancedProductManagementProps {
  userRole?: string
}

export function EnhancedProductManagement({ userRole = 'user' }: EnhancedProductManagementProps) {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // 编辑状态
  const [editingCell, setEditingCell] = useState<{ row: number | null; key: string | null }>({ row: null, key: null })
  const [editingValue, setEditingValue] = useState('')

  // 新产品行状态
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [addRowIndex, setAddRowIndex] = useState<number | null>(null)
  const [newProductData, setNewProductData] = useState<Partial<Product>>({})

  // 文件上传refs
  const fileInputRefs = useRef<{ [key: string]: React.RefObject<HTMLInputElement | null> }>({})

  // 根据用户角色过滤列
  const visibleColumns = PRODUCT_COLUMN_CONFIG.filter(col => 
    col.roles.includes(user?.role || userRole)
  )

  useEffect(() => {
    // 初始化文件上传refs
    IMAGE_COLUMNS.forEach(col => {
      if (!fileInputRefs.current[col]) {
        fileInputRefs.current[col] = React.createRef()
      }
    })
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

  // 获取嵌套对象的值
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // 设置嵌套对象的值
  const setNestedValue = (obj: any, path: string, value: any): any => {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
    return obj
  }

  // 处理单元格编辑
  const handleCellEdit = (rowIndex: number, columnKey: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, key: columnKey })
    setEditingValue(currentValue || '')
  }

  // 保存单元格编辑
  const handleCellSave = async (product: Product, columnKey: string) => {
    try {
      const updatedProduct = { ...product }
      setNestedValue(updatedProduct, columnKey, editingValue)

      // 提取 _id 作为 id，其余作为 productData
      const { _id, ...productData } = updatedProduct
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: _id, ...productData }),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '保存失败')
      }

      await fetchProducts()
      setEditingCell({ row: null, key: null })
      setEditingValue('')
    } catch (error: any) {
      setError(error.message || '保存失败')
    }
  }

  // 处理图片上传
  const handleImageUpload = async (file: File, productId: string, columnKey: string) => {
    try {
      console.log('开始上传图片:', { file: file.name, productId, columnKey })

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      console.log('上传响应状态:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('上传失败:', errorData)
        throw new Error(errorData.error || '图片上传失败')
      }

      const data = await response.json()
      console.log('上传成功，返回数据:', data)
      const imageUrl = data.url

      // 更新产品图片
      const product = products.find(p => p._id === productId)
      if (product) {
        console.log('找到产品，开始更新:', product._id)
        console.log('原始产品数据:', product)
        const updatedProduct = { ...product }
        setNestedValue(updatedProduct, columnKey, imageUrl)
        console.log('更新后的产品数据:', updatedProduct)

        // 提取 _id 作为 id，其余作为 productData
        const { _id, ...productData } = updatedProduct
        console.log('发送更新请求:', { id: _id, columnKey, imageUrl, productData })

        const updateResponse = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: _id, ...productData }),
          credentials: 'include'
        })

        console.log('更新响应状态:', updateResponse.status)

        if (updateResponse.ok) {
          console.log('产品更新成功，刷新产品列表')
          await fetchProducts()
          // 显示成功消息
          setError('')
          console.log('图片上传和产品更新完成')
        } else {
          const errorData = await updateResponse.json()
          console.error('产品更新失败:', errorData)
          throw new Error(errorData.error || '更新产品失败')
        }
      } else {
        console.error('未找到产品:', productId)
        throw new Error('未找到指定产品')
      }
    } catch (error: any) {
      console.error('图片上传过程出错:', error)
      setError(error.message || '图片上传失败')
    }
  }

  // 删除产品
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('确定要删除此产品吗？此操作无法撤销。')) return

    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      await fetchProducts()
    } catch (error: any) {
      setError(error.message || '删除失败')
    }
  }

  // 添加新产品
  const handleAddNewProduct = () => {
    const initialData: Partial<Product> = {
      productType: '',
      brand: '',
      model: '',
      images: { display: '', dimension: '', accessories: '' },
      specifications: { detailed: '', brief: '' },
      appearance: { color: '', installation: '', cutoutSize: '' },
      control: '',
      notes: '',
      pricing: { unitPrice: 0, deliveryTime: '' },
      isActive: true,
      isNew: false,
      order: products.length + 1
    }
    setNewProductData(initialData)
    setIsAddingNew(true)
  }

  // 保存新产品
  const handleSaveNewProduct = async () => {
    try {
      // 验证必填字段
      if (!newProductData.productType || !newProductData.model) {
        setError('产品类型和型号不能为空，请填写完整信息后再保存')
        return
      }

      console.log('准备发送的产品数据:', newProductData)

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProductData),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '添加产品失败')
      }

      await fetchProducts()
      setIsAddingNew(false)
      setNewProductData({})
      setError('') // 清除错误信息
    } catch (error: any) {
      console.error('添加产品错误:', error)
      setError(error.message || '添加产品失败')
    }
  }

  // 处理新产品数据变化
  const handleNewProductChange = (columnKey: string, value: any) => {
    const updatedData = { ...newProductData }
    setNestedValue(updatedData, columnKey, value)
    setNewProductData(updatedData)
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
        <Button onClick={fetchProducts} className="mt-4">
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">产品管理 (增强版)</h3>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchProducts} variant="outline" size="sm">
            刷新
          </Button>
          <Button onClick={handleAddNewProduct} size="sm">
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
          placeholder="搜索产品..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 产品表格 */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="product-table border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 p-2 text-center text-sm font-medium">
                操作
              </th>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="border border-gray-300 p-2 text-center text-sm font-medium"
                  style={{
                    backgroundColor: col.bg,
                    width: col.width,
                    minWidth: col.width,
                    maxWidth: col.width,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 现有产品行 */}
            {products.map((product, rowIndex) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2 text-center">
                  <div className="flex flex-col space-y-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteProduct(product._id!)}
                      className="text-red-600 hover:text-red-700"
                    >
                      删除
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAddRowIndex(rowIndex)
                        setNewProductData({})
                      }}
                    >
                      添加
                    </Button>
                  </div>
                </td>
                {visibleColumns.map((col) => {
                  const value = getNestedValue(product, col.key)
                  const isEditing = editingCell.row === rowIndex && editingCell.key === col.key

                  // 图片列
                  if (IMAGE_COLUMNS.includes(col.key)) {
                    return (
                      <td
                        key={col.key}
                        className="border border-gray-300 p-2 text-center"
                        style={{ backgroundColor: col.bg, width: col.width }}
                      >
                        {value ? (
                          <div className="flex flex-col items-center space-y-2">
                            <div className="relative w-24 h-24">
                              <img
                                src={value}
                                alt={col.label}
                                className="w-full h-full object-contain cursor-pointer border rounded"
                                onClick={() => window.open(value, '_blank')}
                                onError={(e) => {
                                  // 创建错误状态显示
                                  const errorDiv = document.createElement('div')
                                  errorDiv.className = 'w-24 h-24 border border-red-200 bg-red-50 flex flex-col items-center justify-center text-red-400 text-xs rounded'
                                  errorDiv.innerHTML = `
                                    <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span>加载失败</span>
                                  `
                                  e.currentTarget.parentNode?.replaceChild(errorDiv, e.currentTarget)
                                }}
                              />
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRefs.current[col.key]}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleImageUpload(e.target.files[0], product._id!, col.key)
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fileInputRefs.current[col.key]?.current?.click()}
                              className="text-xs"
                            >
                              更换
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-24 h-24 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                              暂无图片
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRefs.current[col.key]}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleImageUpload(e.target.files[0], product._id!, col.key)
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fileInputRefs.current[col.key]?.current?.click()}
                              className="text-xs"
                            >
                              上传
                            </Button>
                          </div>
                        )}
                      </td>
                    )
                  }

                  // 编辑状态
                  if (isEditing) {
                    if (MULTILINE_COLUMNS.includes(col.key)) {
                      return (
                        <td
                          key={col.key}
                          className="border border-gray-300 p-2"
                          style={{ backgroundColor: col.bg, width: col.width }}
                        >
                          <div className="space-y-2">
                            <textarea
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              rows={3}
                              className="w-full text-xs border rounded p-1"
                              autoFocus
                            />
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                onClick={() => handleCellSave(product, col.key)}
                                className="text-xs"
                              >
                                保存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCell({ row: null, key: null })
                                  setEditingValue('')
                                }}
                                className="text-xs"
                              >
                                取消
                              </Button>
                            </div>
                          </div>
                        </td>
                      )
                    } else {
                      return (
                        <td
                          key={col.key}
                          className="border border-gray-300 p-2"
                          style={{ backgroundColor: col.bg, width: col.width }}
                        >
                          <div className="space-y-2">
                            <input
                              type={col.type === 'number' ? 'number' : 'text'}
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-full text-xs border rounded p-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCellSave(product, col.key)
                                } else if (e.key === 'Escape') {
                                  setEditingCell({ row: null, key: null })
                                  setEditingValue('')
                                }
                              }}
                            />
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                onClick={() => handleCellSave(product, col.key)}
                                className="text-xs"
                              >
                                保存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCell({ row: null, key: null })
                                  setEditingValue('')
                                }}
                                className="text-xs"
                              >
                                取消
                              </Button>
                            </div>
                          </div>
                        </td>
                      )
                    }
                  }

                  // 显示状态
                  return (
                    <td
                      key={col.key}
                      className="border border-gray-300 p-2 cursor-pointer hover:bg-gray-100"
                      style={{ backgroundColor: col.bg, width: col.width }}
                      onClick={() => handleCellEdit(rowIndex, col.key, value)}
                    >
                      <div className="text-xs">
                        {MULTILINE_COLUMNS.includes(col.key) ? (
                          <div className="multiline-cell">
                            {value || '(点击编辑)'}
                          </div>
                        ) : SINGLELINE_COLUMNS.includes(col.key) ? (
                          <div className="singleline-cell">
                            {value || '(点击编辑)'}
                          </div>
                        ) : col.type === 'number' ? (
                          <div className="text-right text-xs">
                            {value ? (col.key === 'pricing.unitPrice' ? `¥${value}` : value) : '-'}
                          </div>
                        ) : (
                          <div className="singleline-cell">
                            {value || '(点击编辑)'}
                          </div>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* 新产品行 */}
            {isAddingNew && (
              <tr className="bg-blue-50">
                <td className="border border-gray-300 p-2 text-center">
                  <div className="flex flex-col space-y-1">
                    <Button
                      size="sm"
                      onClick={handleSaveNewProduct}
                      className="text-xs"
                    >
                      保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingNew(false)
                        setNewProductData({})
                      }}
                      className="text-xs"
                    >
                      取消
                    </Button>
                  </div>
                </td>
                {visibleColumns.map((col) => {
                  const value = getNestedValue(newProductData, col.key)

                  // 图片列
                  if (IMAGE_COLUMNS.includes(col.key)) {
                    return (
                      <td
                        key={col.key}
                        className="border border-gray-300 p-2 text-center"
                        style={{ backgroundColor: col.bg, width: col.width }}
                      >
                        <input
                          type="text"
                          value={value || ''}
                          onChange={(e) => handleNewProductChange(col.key, e.target.value)}
                          placeholder="图片URL"
                          className="w-full text-xs border rounded p-1"
                        />
                      </td>
                    )
                  }

                  // 多行文本列
                  if (MULTILINE_COLUMNS.includes(col.key)) {
                    return (
                      <td
                        key={col.key}
                        className="border border-gray-300 p-2"
                        style={{ backgroundColor: col.bg, width: col.width }}
                      >
                        <textarea
                          value={value || ''}
                          onChange={(e) => handleNewProductChange(col.key, e.target.value)}
                          rows={3}
                          placeholder={col.label}
                          className="w-full text-xs border rounded p-1"
                        />
                      </td>
                    )
                  }

                  // 其他列
                  const isRequired = ['productType', 'model'].includes(col.key)
                  return (
                    <td
                      key={col.key}
                      className="border border-gray-300 p-2"
                      style={{ backgroundColor: col.bg, width: col.width }}
                    >
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={value || ''}
                        onChange={(e) => {
                          const inputValue = col.type === 'number' ?
                            (e.target.value ? Number(e.target.value) : 0) :
                            e.target.value
                          handleNewProductChange(col.key, inputValue)
                        }}
                        placeholder={isRequired ? `${col.label} *` : col.label}
                        className={`w-full text-xs border rounded p-1 ${
                          isRequired && !value ? 'border-red-300 bg-red-50' : ''
                        }`}
                      />
                    </td>
                  )
                })}
              </tr>
            )}

            {/* 空状态 */}
            {products.length === 0 && !isAddingNew && (
              <tr>
                <td
                  colSpan={visibleColumns.length + 1}
                  className="border border-gray-300 p-8 text-center text-gray-500"
                >
                  暂无产品数据，点击"添加产品"开始添加
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 统计信息 */}
      <div className="text-sm text-gray-600">
        显示 {products.length} 个产品
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setError('')}
            className="mt-2"
          >
            关闭
          </Button>
        </div>
      )}
    </div>
  )
}
