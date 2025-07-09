'use client'

import React, { useState, useEffect, Fragment, useCallback } from 'react'
import { Product, VariableType, ColumnConfig, PRODUCT_COLUMN_CONFIG } from '@/types/product'
import { UserRole } from '@/types/auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ImageThumbnail } from '@/components/ui/ImageThumbnail'
import { CopyableCell } from '@/components/ui/CopyableCell'
import { ClickableModelCell } from '@/components/ui/ClickableModelCell'
import { ProductTypeFilter } from '@/components/ui/ProductTypeFilter'

import { Loader2, Search, Check, Plus, Info } from 'lucide-react'
import { getNestedValue, shouldShowPrice, getPriceDisplay } from '@/lib/utils'

interface ProductSelectionTableV3Props {
  userRole: UserRole
}

interface SelectedVariables {
  [productId: string]: {
    [key in VariableType]?: string
  }
}

export function ProductSelectionTableV3({ userRole }: ProductSelectionTableV3Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [columns, setColumns] = useState<ColumnConfig[]>([])
  const [variableColumns, setVariableColumns] = useState<{[key: string]: ColumnConfig}>({})
  const [addButtonColumn, setAddButtonColumn] = useState<ColumnConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductType, setSelectedProductType] = useState('')
  const [selectedVariables, setSelectedVariables] = useState<SelectedVariables>({})
  const [generatedModels, setGeneratedModels] = useState<{[productId: string]: string}>({})

  // 价格显示状态：true为含税价格，false为市场价格
  const [showFactoryPrice, setShowFactoryPrice] = useState(true)

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  // 从API获取列配置
  const loadColumns = useCallback(async () => {
    try {
      const response = await fetch('/api/columns', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取列配置失败')
      }

      const data = await response.json()
      // 过滤出ProductSelectionTableV3需要的基础列，按order排序
      const filteredColumns = (data.columns || [])
        .filter((col: ColumnConfig) =>
          // 只包含ProductSelectionTableV3需要的基础列
          [
            'order', 'productType', 'brand', 'model', 'images.display', 'images.dimension',
            'images.accessories', 'specifications.detailed', 'appearance.installation',
            'appearance.cutoutSize', 'productremark', 'pricing.unitPrice',
            'pricing.deliveryTime', 'vendorLED', 'vendorDriver', 'orderCode'
          ].includes(col.key) && col.isVisible
        )
        .sort((a: ColumnConfig, b: ColumnConfig) => a.order - b.order)

      // 获取addButton列配置
      const addButtonColumn = (data.columns || []).find((col: ColumnConfig) => col.key === 'addButton')

      // 单独获取变量列配置
      const variableColumnMap: {[key: string]: ColumnConfig} = {}
      const variableKeys = ['colorTemperature', 'beamAngle', 'appearanceColor', 'controlMethod']
      variableKeys.forEach(key => {
        const varCol = (data.columns || []).find((col: ColumnConfig) => col.key === key)
        if (varCol) {
          variableColumnMap[key] = varCol
        }
      })

      setColumns(filteredColumns)
      setVariableColumns(variableColumnMap)
      setAddButtonColumn(addButtonColumn || null)
    } catch (error) {
      console.error('加载列配置失败:', error)
      // 如果API失败，使用默认配置
      setColumns(getDefaultColumns())
      // 设置默认的变量列配置
      setVariableColumns({
        colorTemperature: { key: 'colorTemperature', label: '色温', type: 'variable', width: '3%', roles: ['user', 'dealer', 'admin'], order: 11, isVisible: true },
        beamAngle: { key: 'beamAngle', label: '光束角', type: 'variable', width: '3%', roles: ['user', 'dealer', 'admin'], order: 12, isVisible: true },
        appearanceColor: { key: 'appearanceColor', label: '外观颜色', type: 'variable', width: '5%', roles: ['user', 'dealer', 'admin'], order: 13, isVisible: true },
        controlMethod: { key: 'controlMethod', label: '控制方式', type: 'variable', width: '5%', roles: ['user', 'dealer', 'admin'], order: 14, isVisible: true }
      })
      // 设置默认的addButton列配置
      setAddButtonColumn({ key: 'addButton', label: '添加', type: 'action', width: '3%', roles: ['user', 'dealer', 'admin'], order: 36, isVisible: true })
    }
  }, [])

  // 默认列配置（当API失败时使用）
  const getDefaultColumns = (): ColumnConfig[] => {
    const orderedColumns = [
      { key: 'order', label: '显示顺序', type: 'number' as const, width: '3%' },
      { key: 'productType', label: '产品类型', type: 'text' as const, width: '8%' },
      { key: 'brand', label: '品牌', type: 'text' as const, width: '4%' },
      { key: 'model', label: '产品型号', type: 'text' as const, width: '10%' },
      { key: 'images.display', label: '产品图', type: 'image' as const, width: '4%' },
      { key: 'images.dimension', label: '尺寸图', type: 'image' as const, width: '4%' },
      { key: 'images.accessories', label: '配件图', type: 'image' as const, width: '4%' },
      { key: 'specifications.detailed', label: '技术参数', type: 'text' as const, width: '10%' },
      { key: 'appearance.installation', label: '安装方式', type: 'text' as const, width: '10%' },
      { key: 'appearance.cutoutSize', label: '开孔尺寸', type: 'text' as const, width: '8%' },
      { key: 'productremark', label: '产品备注', type: 'text' as const, width: '5%' },
      { key: 'pricing.unitPrice', label: '含税价格', type: 'number' as const, width: '4%' },
      { key: 'pricing.deliveryTime', label: '预计交货', type: 'number' as const, width: '5%' },
      { key: 'vendorLED', label: 'LED', type: 'text' as const, width: '4%' },
      { key: 'vendorDriver', label: '驱动', type: 'text' as const, width: '4%' }
    ]

    return orderedColumns.map((col, index) => ({
      ...col,
      _id: col.key,
      roles: ['admin', 'user'],
      bg: '#e6f7e6',
      order: index + 1,
      isVisible: true
    }))
  }

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const params = new URLSearchParams()
      params.append('active', 'true')
      // 移除搜索参数，改为客户端搜索以提供更流畅的体验

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
      console.error('加载产品失败:', error)
      setError(error instanceof Error ? error.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadColumns()
    loadProducts()
  }, [loadColumns, loadProducts])

  // 智能搜索函数
  const smartSearch = (product: Product, searchTerm: string): boolean => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    const getNestedValue = (obj: any, path: string): any => {
      return path.split('.').reduce((current, key) => current?.[key], obj)
    }

    return (
      getNestedValue(product, 'name')?.toString().toLowerCase().includes(searchLower) ||
      getNestedValue(product, 'model')?.toString().toLowerCase().includes(searchLower) ||
      getNestedValue(product, 'productType')?.toString().toLowerCase().includes(searchLower) ||
      getNestedValue(product, 'brand')?.toString().toLowerCase().includes(searchLower) ||
      getNestedValue(product, 'specifications.brief')?.toString().toLowerCase().includes(searchLower) ||
      getNestedValue(product, 'notes')?.toString().toLowerCase().includes(searchLower) ||
      getNestedValue(product, 'productremark')?.toString().toLowerCase().includes(searchLower)
    )
  }

  const filteredProducts = products.filter(product => {
    // 首先应用智能搜索筛选
    if (!smartSearch(product, searchTerm)) return false

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

  // 检查是否所有必需的变量都已选择
  const isAllVariablesSelected = (variables: {[key in VariableType]?: string}): boolean => {
    const requiredVariables: VariableType[] = ['colorTemperature', 'beamAngle', 'appearanceColor', 'controlMethod']
    return requiredVariables.every(varType => variables[varType] && variables[varType].trim() !== '')
  }

  // 处理变量选择
  const handleVariableSelect = (productId: string, variableType: VariableType, value: string) => {
    setSelectedVariables(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [variableType]: value
      }
    }))
    
    // 生成产品型号
    generateProductModel(productId, {
      ...selectedVariables[productId],
      [variableType]: value
    })
  }

  // 生成产品型号
  const generateProductModel = async (productId: string, variables: {[key in VariableType]?: string}) => {
    const product = products.find(p => p._id === productId)
    if (!product) return

    console.log('生成产品型号 - 产品ID:', productId)
    console.log('生成产品型号 - 变量:', variables)
    console.log('生成产品型号 - 基础型号:', product.model)

    // 检查是否所有必需的变量都已选择
    if (!isAllVariablesSelected(variables)) {
      console.log('生成产品型号 - 变量未全部选择，清除型号')
      // 如果不是所有变量都选择了，清除生成的型号
      setGeneratedModels(prev => ({
        ...prev,
        [productId]: ''
      }))
      return
    }

    console.log('生成产品型号 - 所有变量已选择，开始生成')

    try {
      const response = await fetch('/api/product-model-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          baseModel: product.model,
          variables: variables
        }),
        credentials: 'include'
      })

      console.log('生成产品型号 - API响应状态:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('生成产品型号 - API响应数据:', data)
        setGeneratedModels(prev => ({
          ...prev,
          [productId]: data.generatedModel
        }))
        console.log('生成产品型号 - 设置生成的型号:', data.generatedModel)
      } else {
        const errorData = await response.json()
        console.error('生成产品型号 - API错误:', errorData)
      }
    } catch (error) {
      console.error('生成产品型号失败:', error)
    }
  }

  // 添加到项目清单
  const addToProjectList = (product: Product) => {
    const productId = product._id!
    const selectedVars = selectedVariables[productId] || {}

    // 检查是否所有必需的变量都已选择
    if (!isAllVariablesSelected(selectedVars)) {
      showErrorToast('请选择产品参数')
      return
    }

    // 检查是否已生成型号
    const generatedModel = generatedModels[productId]
    if (!generatedModel || generatedModel.trim() === '') {
      showErrorToast('请选择产品参数')
      return
    }

    try {
      const existingList = JSON.parse(sessionStorage.getItem('projectList') || '[]')

      // 根据当前价格显示类型确定价格
      const unitPrice = showFactoryPrice
        ? (product.pricing?.unitPrice || 0)
        : (product.pricing?.marketPrice || (product.pricing?.unitPrice || 0) / 0.4)

      const productItem = {
        productId: `${productId}_${JSON.stringify(selectedVars)}`,
        product: product,
        selectedVariables: selectedVars,
        generatedModel: generatedModel,
        quantity: 1,
        addedAt: new Date().toISOString(),
        // 保存当前的价格类型和对应的价格
        priceType: showFactoryPrice ? 'factory' : 'market',
        unitPrice: unitPrice
      }

      const existingIndex = existingList.findIndex((item: any) =>
        item.productId === productItem.productId
      )

      let message = ''
      if (existingIndex >= 0) {
        existingList[existingIndex].quantity += 1
        message = `${product.name} 数量已增加到 ${existingList[existingIndex].quantity}`
      } else {
        existingList.push(productItem)
        message = `已将 ${product.name} 添加到项目清单`
      }

      sessionStorage.setItem('projectList', JSON.stringify(existingList))
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
    }, 2000)
  }

  // 渲染单元格内容
  const renderCell = (product: Product, column: ColumnConfig) => {
    const getNestedValue = (obj: any, path: string): any => {
      return path.split('.').reduce((current, key) => current?.[key], obj)
    }

    // 特殊处理vendorLED和vendorDriver字段
    if (column.key === 'vendorLED' || column.key === 'vendorDriver') {
      let value = getNestedValue(product, column.key)
      // 如果没有直接的vendor值，尝试从specifications.detailed中提取
      if (!value) {
        const detailed = product.specifications?.detailed || ''
        if (column.key === 'vendorLED') {
          const chipMatch = detailed.match(/芯片[：:]\s*([^\n\r]+)/i) || detailed.match(/LED芯片[：:]\s*([^\n\r]+)/i)
          value = chipMatch ? chipMatch[1].trim() : ''
        }
        if (column.key === 'vendorDriver') {
          const driverMatch = detailed.match(/驱动[：:]\s*([^\n\r]+)/i) || detailed.match(/驱动电源[：:]\s*([^\n\r]+)/i)
          value = driverMatch ? driverMatch[1].trim() : ''
        }
      }
      return value || '-'
    }

    let value = getNestedValue(product, column.key)

    // 向后兼容：如果是新的productremark字段但没有值，尝试使用旧的notes字段
    if (column.key === 'productremark' && !value) {
      value = getNestedValue(product, 'notes')
    }

    if (column.type === 'image' && value) {
      return <ImageThumbnail src={value} alt={`${product.name || product.model} ${column.label}`} />
    }

    if (column.key === 'pricing.unitPrice' && typeof value === 'number') {
      // 获取当前产品的控制方式
      const controlMethod = selectedVariables[product._id?.toString() || '']?.controlMethod

      // 根据控制方式决定显示内容
      if (!shouldShowPrice(controlMethod)) {
        return (
          <div className="text-xs">
            <div className="text-gray-400 text-[10px] leading-tight">
              系统只显示Onoff产品价格，调光产品价格请咨询销售人员
            </div>
          </div>
        )
      }

      const priceText = showFactoryPrice
        ? `￥${value.toFixed(2)}`
        : `￥${(value / 0.4).toFixed(2)}`
      return (
        <div className="text-xs">
          <CopyableCell value={priceText} className="text-xs" />
          <div className="text-gray-400 text-[10px] mt-0.5">Onoff产品价格</div>
        </div>
      )
    }

    // 特殊处理产品名称列 - 添加NEW标记
    if (column.key === 'name' && value) {
      return (
        <div className="relative text-xs">
          {product.isNew && (
            <div className="flex items-center justify-center mb-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium bg-red-100 text-red-800 border border-red-200">
                NEW
              </span>
            </div>
          )}
          <CopyableCell value={value.toString()} className="text-xs" />
        </div>
      )
    }

    // 特殊处理产品型号列 - 支持链接跳转，减小字号，添加NEW标记
    if (column.key === 'model' && value) {
      const modelLink = product.modelLink
      if (modelLink) {
        return (
          <div className="text-center">
            {product.isNew && (
              <div className="flex items-center justify-center mb-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium bg-red-100 text-red-800 border border-red-200">
                  NEW
                </span>
              </div>
            )}
            <a
              href={modelLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer text-[10px] break-all inline-block w-full py-1 touch-manipulation"
              title={`点击访问 ${value} 的详细信息`}
              onClick={(e) => {
                // 确保链接点击事件不被阻止
                e.stopPropagation()
              }}
              onTouchStart={(e) => {
                // 移动端触摸事件处理
                e.stopPropagation()
              }}
            >
              {value}
            </a>
          </div>
        )
      } else {
        // 如果没有链接，显示普通文本
        return (
          <div className="text-center">
            {product.isNew && (
              <div className="flex items-center justify-center mb-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium bg-red-100 text-red-800 border border-red-200">
                  NEW
                </span>
              </div>
            )}
            <span className="text-[10px] break-all">{value}</span>
          </div>
        )
      }
    }

    // 特殊处理预计交货时间，自动添加"天"字
    if (column.key === 'pricing.deliveryTime' && value) {
      const numValue = typeof value === 'number' ? value : parseInt(value)
      const deliveryText = isNaN(numValue) ? value : `${numValue}天`
      return <CopyableCell value={deliveryText.toString()} className="text-xs" />
    }

    if (typeof value === 'boolean') {
      return <CopyableCell value={value ? '是' : '否'} className="text-xs" />
    }

    // 特殊处理技术参数列，支持多行显示
    if (column.key === 'specifications.detailed' && value) {
      return (
        <CopyableCell
          value={value.toString()}
          className="whitespace-pre-line text-xs leading-tight overflow-hidden block text-left sm:max-h-20 max-h-16"
        />
      )
    }

    // 对于其他所有文本内容，使用CopyableCell
    const textValue = value?.toString() || '-'
    return <CopyableCell value={textValue} className="text-xs" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="搜索产品信息..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 h-5 w-5 sm:h-4 sm:w-4 flex items-center justify-center"
            title="清空搜索"
          >
            ×
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* 产品统计 */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
        <div className="text-xs sm:text-sm text-gray-600">
          共找到 <span className="font-medium text-gray-900">{filteredProducts.length}</span> 个产品
          {paginatedProducts.length > 0 && (
            <>
              <span className="hidden sm:inline">，当前显示第 <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(endIndex, filteredProducts.length)}</span> 个</span>
              <span className="sm:hidden">（第 {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} 个）</span>
            </>
          )}
        </div>
      </div>

      {/* 产品类型筛选 */}
      <ProductTypeFilter
        products={products}
        selectedType={selectedProductType}
        onTypeChange={setSelectedProductType}
        className="print:hidden"
      />

      {/* 移动端提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 sm:hidden print:hidden">
        <div className="text-blue-800 text-xs">
          💡 提示：点击&quot;更多&quot;按钮查看产品详细信息和选择变量参数、添加到列表
        </div>
      </div>

      {/* 产品表格 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="w-full overflow-x-auto table-container">
          <Table className="product-table responsive-table compact-table min-w-full">
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => {
                  // 移动端图片列合并处理 - 只显示产品图列，但标题显示三个图片类型
                  if (column.key === 'images.display') {
                    return (
                      <Fragment key={column.key}>
                        <TableHead
                          style={{
                            width: column.width,
                            minWidth: column.width,
                            maxWidth: column.width
                          }}
                          className="bg-gray-50 font-semibold text-xs px-1 py-2 hidden sm:table-cell"
                        >
                          <div className="break-words">{column.label}</div>
                        </TableHead>
                        {/* 移动端合并的图片列 */}
                        <TableHead
                          className="bg-gray-50 font-semibold text-xs px-0.5 py-1.5 sm:hidden"
                          style={{width: '8%'}}
                        >
                          <div className="break-words text-center leading-tight">
                            产品图<br/>尺寸图<br/>配件图
                          </div>
                        </TableHead>
                      </Fragment>
                    )
                  }

                  // 移动端隐藏尺寸图和配件图列
                  if (column.key === 'images.dimension' || column.key === 'images.accessories') {
                    return (
                      <TableHead
                        key={column.key}
                        style={{
                          width: column.width,
                          minWidth: column.width,
                          maxWidth: column.width
                        }}
                        className="bg-gray-50 font-semibold text-xs px-1 py-2 hidden sm:table-cell"
                      >
                        <div className="break-words">{column.label}</div>
                      </TableHead>
                    )
                  }

                  // 在开孔尺寸后面插入变量选择列
                  if (column.key === 'appearance.cutoutSize') {
                    return (
                      <Fragment key={column.key}>
                        <TableHead
                          style={{
                            width: column.width,
                            minWidth: column.width,
                            maxWidth: column.width
                          }}
                          className="bg-gray-50 font-semibold text-xs px-1 py-2"
                        >
                          <div className="break-words">{column.label}</div>
                        </TableHead>
                        {/* 变量选择列 - 在开孔尺寸后面，移动端隐藏 */}
                        <TableHead className="bg-blue-50 font-semibold text-xs px-1 py-2 border-l-2 border-blue-300 hidden sm:table-cell" style={{width: variableColumns.colorTemperature?.width || '7%'}}>
                          <div className="break-words text-blue-800">{variableColumns.colorTemperature?.label || '色温'}</div>
                        </TableHead>
                        <TableHead className="bg-blue-50 font-semibold text-xs px-1 py-2 hidden sm:table-cell" style={{width: variableColumns.beamAngle?.width || '7%'}}>
                          <div className="break-words text-blue-800">{variableColumns.beamAngle?.label || '光束角'}</div>
                        </TableHead>
                        <TableHead className="bg-blue-50 font-semibold text-xs px-1 py-2 hidden sm:table-cell" style={{width: variableColumns.appearanceColor?.width || '7%'}}>
                          <div className="break-words text-blue-800">{variableColumns.appearanceColor?.label || '外观颜色'}</div>
                        </TableHead>
                        <TableHead className="bg-blue-50 font-semibold text-xs px-1 py-2 border-r-2 border-blue-300 hidden sm:table-cell" style={{width: variableColumns.controlMethod?.width || '7%'}}>
                          <div className="break-words text-blue-800">{variableColumns.controlMethod?.label || '控制方式'}</div>
                        </TableHead>
                      </Fragment>
                    )
                  }

                  // 订货代码列 - 通过列配置动态渲染，移动端隐藏
                  if (column.key === 'orderCode') {
                    return (
                      <TableHead
                        key={column.key}
                        className="bg-green-50 font-semibold text-xs px-1 py-2 border-l-2 border-green-300 hidden sm:table-cell"
                        style={{width: column.width || '12%'}}
                      >
                        <div className="break-words text-green-800">{column.label}</div>
                      </TableHead>
                    )
                  }

                  // 含税价格列，移动端隐藏
                  if (column.key === 'pricing.unitPrice') {
                    return (
                      <TableHead
                        key={column.key}
                        style={{
                          width: column.width,
                          minWidth: column.width,
                          maxWidth: column.width
                        }}
                        className="bg-gray-50 font-semibold text-xs px-1 py-2 cursor-pointer hover:bg-blue-50 transition-colors hidden sm:table-cell"
                        onClick={() => setShowFactoryPrice(!showFactoryPrice)}
                        title="点击切换价格类型"
                      >
                        <div className="break-words text-blue-600">
                          {showFactoryPrice ? '含税价格' : '市场价格'}
                        </div>
                      </TableHead>
                    )
                  }

                  // 其他普通列
                  // 定义移动端隐藏的列 - 根据用户需求，移动端只显示基础信息，其他信息通过弹出框查看
                  const mobileHiddenColumns = [
                    'brand', 'productremark', 'pricing.unitPrice', 'pricing.deliveryTime',
                    'vendorLED', 'vendorDriver', 'orderCode'
                  ]
                  const isMobileHidden = mobileHiddenColumns.includes(column.key)

                  return (
                    <TableHead
                      key={column.key}
                      style={{
                        width: column.width,
                        minWidth: column.width,
                        maxWidth: column.width
                      }}
                      className={`bg-gray-50 font-semibold text-xs px-0.5 py-1.5 ${
                        column.key === 'pricing.unitPrice' ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''
                      } ${isMobileHidden ? 'hidden sm:table-cell' : ''} ${
                        column.key === 'specifications.detailed' ? 'sm:w-[10%] w-[10%]' : ''
                      }`}
                      onClick={column.key === 'pricing.unitPrice' ? () => setShowFactoryPrice(!showFactoryPrice) : undefined}
                      title={column.key === 'pricing.unitPrice' ? "点击切换价格类型" : undefined}
                    >
                      <div className={`break-words ${column.key === 'pricing.unitPrice' ? 'text-blue-600' : ''}`}>
                        {column.key === 'pricing.unitPrice'
                          ? (showFactoryPrice ? '含税价格' : '市场价格')
                          : column.label
                        }
                      </div>
                    </TableHead>
                  )
                })}
                {/* 移动端更多信息列 */}
                <TableHead className="bg-gray-50 font-semibold text-xs px-0.5 py-1.5 text-center sm:hidden" style={{width: '4%'}}>
                  <div className="break-words">更多</div>
                </TableHead>
                {/* 添加按钮列，移动端隐藏 */}
                <TableHead className="bg-gray-50 font-semibold text-xs px-1 py-2 text-center hidden sm:table-cell" style={{width: addButtonColumn?.width || '3%'}}>
                  <div className="break-words">添加</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 6}
                    className="text-center py-8 text-gray-500"
                  >
                    {searchTerm ? '未找到匹配的产品' : '暂无产品数据'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <ProductSelectionRowV3
                    key={product._id}
                    product={product}
                    columns={columns}
                    variableColumns={variableColumns}
                    addButtonColumn={addButtonColumn}
                    selectedVariables={selectedVariables[product._id!] || {}}
                    generatedModel={generatedModels[product._id!] || ''}
                    onVariableSelect={(variableType, value) => handleVariableSelect(product._id!, variableType, value)}
                    onAddToProject={() => addToProjectList(product)}
                    renderCell={renderCell}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 分页控件 */}
      {filteredProducts.length > itemsPerPage && (
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
            <span className="hidden sm:inline">显示 {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} 项，共 {filteredProducts.length} 项</span>
            <span className="sm:hidden">共 {filteredProducts.length} 项</span>
          </div>

          <div className="flex items-center space-x-2 order-1 sm:order-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="text-xs sm:text-sm text-gray-600 px-1">
              <span className="hidden sm:inline">第 {currentPage} 页，共 {totalPages} 页</span>
              <span className="sm:hidden">{currentPage}/{totalPages}</span>
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 产品行组件V3
interface ProductSelectionRowV3Props {
  product: Product
  columns: ColumnConfig[]
  variableColumns: {[key: string]: ColumnConfig}
  addButtonColumn: ColumnConfig | null
  selectedVariables: {[key in VariableType]?: string}
  generatedModel: string
  onVariableSelect: (variableType: VariableType, value: string) => void
  onAddToProject: () => void
  renderCell: (product: Product, column: ColumnConfig) => React.ReactNode
}

function ProductSelectionRowV3({
  product,
  columns,
  variableColumns,
  addButtonColumn,
  selectedVariables,
  generatedModel,
  onVariableSelect,
  onAddToProject,
  renderCell
}: ProductSelectionRowV3Props) {
  return (
    <TableRow className="hover:bg-gray-50">
      {/* 基础产品信息列 */}
      {columns.map((column) => {
        // 在开孔尺寸后面插入变量选择列
        if (column.key === 'appearance.cutoutSize') {
          return (
            <Fragment key={column.key}>
              <TableCell
                style={{
                  width: column.width,
                  minWidth: column.width,
                  maxWidth: column.width
                }}
                className="text-xs px-1 py-2"
              >
                {renderCell(product, column)}
              </TableCell>
              {/* 变量选择列 - 在开孔尺寸后面，移动端隐藏 */}
              <TableCell className="text-xs px-1 py-2 bg-blue-50 border-l-2 border-blue-200 hidden sm:table-cell" style={{width: variableColumns.colorTemperature?.width || '7%'}}>
                <VariableSelectionButtonsV3
                  product={product}
                  variableType="colorTemperature"
                  selectedValue={selectedVariables.colorTemperature}
                  onVariableSelect={onVariableSelect}
                />
              </TableCell>

              <TableCell className="text-xs px-1 py-2 bg-blue-50 hidden sm:table-cell" style={{width: variableColumns.beamAngle?.width || '7%'}}>
                <VariableSelectionButtonsV3
                  product={product}
                  variableType="beamAngle"
                  selectedValue={selectedVariables.beamAngle}
                  onVariableSelect={onVariableSelect}
                />
              </TableCell>

              <TableCell className="text-xs px-1 py-2 bg-blue-50 hidden sm:table-cell" style={{width: variableColumns.appearanceColor?.width || '7%'}}>
                <VariableSelectionButtonsV3
                  product={product}
                  variableType="appearanceColor"
                  selectedValue={selectedVariables.appearanceColor}
                  onVariableSelect={onVariableSelect}
                />
              </TableCell>

              <TableCell className="text-xs px-1 py-2 bg-blue-50 border-r-2 border-blue-200 hidden sm:table-cell" style={{width: variableColumns.controlMethod?.width || '7%'}}>
                <VariableSelectionButtonsV3
                  product={product}
                  variableType="controlMethod"
                  selectedValue={selectedVariables.controlMethod}
                  onVariableSelect={onVariableSelect}
                />
              </TableCell>
            </Fragment>
          )
        }

        // 订货代码列 - 通过列配置动态渲染，移动端隐藏
        if (column.key === 'orderCode') {
          return (
            <TableCell
              key={column.key}
              className="text-xs px-1 py-2 bg-green-50 border-l-2 border-green-200 hidden sm:table-cell"
              style={{width: column.width || '12%'}}
            >
              <div className="font-mono text-xs break-all bg-white border border-green-300 rounded px-2 py-1 min-h-[24px] flex items-center">
                {generatedModel ? (
                  <CopyableCell value={generatedModel} className="font-mono text-xs break-all" />
                ) : (
                  <span className="text-gray-400 italic">请选择所有参数</span>
                )}
              </div>
            </TableCell>
          )
        }

        // 含税价格列，移动端隐藏
        if (column.key === 'pricing.unitPrice') {
          return (
            <TableCell
              key={column.key}
              style={{
                width: column.width,
                minWidth: column.width,
                maxWidth: column.width
              }}
              className="text-xs px-1 py-2 hidden sm:table-cell"
            >
              {renderCell(product, column)}
            </TableCell>
          )
        }

        // 移动端图片列合并处理
        if (column.key === 'images.display') {
          return (
            <Fragment key={column.key}>
              {/* PC端显示单独的产品图列 */}
              <TableCell
                style={{
                  width: column.width,
                  minWidth: column.width,
                  maxWidth: column.width
                }}
                className="text-xs px-1 py-2 hidden sm:table-cell"
              >
                {renderCell(product, column)}
              </TableCell>
              {/* 移动端显示合并的图片列 - 产品图最大，其他图片适中 */}
              <TableCell
                className="text-xs px-0.5 py-1.5 sm:hidden"
                style={{width: '8%'}}
              >
                <div className="flex gap-1 h-full">
                  {/* 产品图 - 左侧，较大 */}
                  <div className="flex items-center justify-center flex-shrink-0">
                    {product.images?.display && (
                      <ImageThumbnail
                        src={product.images.display}
                        alt={`${product.name || product.model} 产品图`}
                        thumbnailClassName="w-8 h-8"
                        className="object-cover"
                      />
                    )}
                  </div>
                  {/* 右侧：尺寸图（上）和配件图（下） */}
                  <div className="flex flex-col gap-0.5 flex-1">
                    {/* 尺寸图 - 右上 */}
                    <div className="flex justify-center items-center flex-1">
                      {product.images?.dimension && (
                        <ImageThumbnail
                          src={product.images.dimension}
                          alt={`${product.name || product.model} 尺寸图`}
                          thumbnailClassName="w-5 h-5"
                          className="object-cover"
                        />
                      )}
                    </div>
                    {/* 配件图 - 右下 */}
                    <div className="flex justify-center items-center flex-1">
                      {product.images?.accessories && (
                        <ImageThumbnail
                          src={product.images.accessories}
                          alt={`${product.name || product.model} 配件图`}
                          thumbnailClassName="w-5 h-5"
                          className="object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
            </Fragment>
          )
        }

        // 移动端隐藏尺寸图和配件图列
        if (column.key === 'images.dimension' || column.key === 'images.accessories') {
          return (
            <TableCell
              key={column.key}
              style={{
                width: column.width,
                minWidth: column.width,
                maxWidth: column.width
              }}
              className="text-xs px-1 py-2 hidden sm:table-cell"
            >
              {renderCell(product, column)}
            </TableCell>
          )
        }

        // 其他普通列
        // 定义移动端隐藏的列（与表头保持一致）
        const mobileHiddenColumns = [
          'brand', 'productremark', 'pricing.unitPrice', 'pricing.deliveryTime',
          'vendorLED', 'vendorDriver', 'orderCode'
        ]
        const isMobileHidden = mobileHiddenColumns.includes(column.key)

        return (
          <TableCell
            key={column.key}
            style={{
              width: column.width,
              minWidth: column.width,
              maxWidth: column.width
            }}
            className={`text-xs px-0.5 py-1.5 ${
              column.key === 'specifications.detailed' ? 'align-top' : ''
            } ${isMobileHidden ? 'hidden sm:table-cell' : ''} ${
              column.key === 'specifications.detailed' ? 'sm:w-[10%] w-[18%]' : ''
            } ${column.key === 'model' ? 'relative' : ''}`}
            onClick={(e) => {
              // 如果点击的是产品型号列的链接，不阻止事件传播
              if (column.key === 'model') {
                const target = e.target as HTMLElement
                if (target.tagName === 'A' || target.closest('a')) {
                  return // 让链接正常工作
                }
              }
            }}
          >
            {renderCell(product, column)}
          </TableCell>
        )
      })}

      {/* 移动端更多信息列 */}
      <TableCell className="text-xs px-0.5 py-1.5 text-center sm:hidden" style={{width: '4%'}}>
        <ProductDetailDialog
          product={product}
          selectedVariables={selectedVariables}
          generatedModel={generatedModel}
          renderCell={renderCell}
          onVariableSelect={onVariableSelect}
          onAddToProject={onAddToProject}
        />
      </TableCell>

      {/* 添加按钮列，移动端隐藏 */}
      <TableCell className="text-xs px-1 py-2 text-center hidden sm:table-cell" style={{width: addButtonColumn?.width || '3%'}}>
        <button
          type="button"
          onClick={onAddToProject}
          disabled={!generatedModel || generatedModel.trim() === ''}
          className={`
            inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold transition-colors duration-200 focus:outline-none
            ${generatedModel && generatedModel.trim() !== ''
              ? 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
          title={
            generatedModel && generatedModel.trim() !== ''
              ? `添加 ${product.name || product.model} 到项目清单`
              : '请先选择所有产品参数'
          }
        >
          <Plus className="h-3 w-3" />
        </button>
      </TableCell>
    </TableRow>
  )
}

// 单个变量选择按钮组件V3
interface VariableSelectionButtonsV3Props {
  product: Product
  variableType: VariableType
  selectedValue?: string
  onVariableSelect: (variableType: VariableType, value: string) => void
}

function VariableSelectionButtonsV3({
  product,
  variableType,
  selectedValue,
  onVariableSelect
}: VariableSelectionButtonsV3Props) {
  const [availableOptions, setAvailableOptions] = useState<string[]>([])

  const loadAvailableOptions = async () => {
    try {
      // 从产品的productVariables中获取该变量类型的可选项
      const options = product.productVariables?.[variableType] || []
      setAvailableOptions(options)
    } catch (error) {
      console.error('加载变量选项失败:', error)
    }
  }

  useEffect(() => {
    loadAvailableOptions()
  }, [product.productVariables, variableType])

  if (availableOptions.length === 0) {
    return <div className="text-gray-400 text-xs">-</div>
  }

  return (
    <div className="space-y-0.5">
      {availableOptions.map((optionValue) => {
        const isSelected = selectedValue === optionValue

        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onVariableSelect(variableType, optionValue)}
            className={`
              block w-full px-2 py-1 rounded-sm text-xs border transition-all text-center font-medium
              ${isSelected
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }
            `}
            title={optionValue}
          >
            <div className="flex items-center justify-center gap-1">
              {isSelected && <Check className="h-2 w-2 flex-shrink-0" />}
              <span className="truncate text-xs">{optionValue}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// 产品详细信息对话框组件
interface ProductDetailDialogProps {
  product: Product
  selectedVariables: {[key in VariableType]?: string}
  generatedModel: string
  renderCell: (product: Product, column: ColumnConfig) => React.ReactNode
  onVariableSelect: (variableType: VariableType, value: string) => void
  onAddToProject: () => void
}

function ProductDetailDialog({ product, selectedVariables, generatedModel, renderCell, onVariableSelect, onAddToProject }: ProductDetailDialogProps) {
  const [showAnimation, setShowAnimation] = useState(false)

  // 移动端弹窗的添加到项目清单处理
  const handleMobileAddToProject = () => {
    // 执行添加操作
    onAddToProject()

    // 显示+1动画
    setShowAnimation(true)
    setTimeout(() => {
      setShowAnimation(false)
    }, 800)
  }
  // 定义需要在对话框中显示的列信息
  const dialogColumns: ColumnConfig[] = [
    { key: 'model', label: '产品型号', type: 'text' as const, width: '100%', roles: ['admin', 'dealer', 'user'], order: 0, isVisible: true },
    { key: 'colorTemperature', label: '色温', type: 'variable' as const, width: '100%', roles: ['admin', 'dealer', 'user'], order: 1, isVisible: true },
    { key: 'beamAngle', label: '光束角', type: 'variable' as const, width: '100%', roles: ['admin', 'dealer', 'user'], order: 2, isVisible: true },
    { key: 'appearanceColor', label: '外观颜色', type: 'variable' as const, width: '100%', roles: ['admin', 'dealer', 'user'], order: 3, isVisible: true },
    { key: 'controlMethod', label: '控制方式', type: 'variable' as const, width: '100%', roles: ['admin', 'dealer', 'user'], order: 4, isVisible: true },
    { key: 'productremark', label: '产品备注', type: 'text' as const, width: '100%', roles: ['admin', 'dealer', 'user'], order: 5, isVisible: true },
    { key: 'orderCode', label: '订货代码', type: 'text' as const, width: '100%', roles: ['admin', 'dealer', 'user'], order: 6, isVisible: true },
    { key: 'pricing.unitPrice', label: '含税价格', type: 'number' as const, width: '100%', roles: ['admin', 'dealer'], order: 7, isVisible: true },
    { key: 'pricing.deliveryTime', label: '预计交货时间', type: 'number' as const, width: '100%', roles: ['admin', 'dealer', 'user'], order: 8, isVisible: true }
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          title="查看更多产品信息"
        >
          <Info className="h-3 w-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-semibold">
            {product.name || product.model} - 详细信息
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
          {dialogColumns.map((column) => {
            let value: React.ReactNode = null

            if (column.type === 'variable') {
              // 在对话框中显示变量选择按钮
              const variableKey = column.key as VariableType
              value = (
                <VariableSelectionButtonsV3
                  product={product}
                  variableType={variableKey}
                  selectedValue={selectedVariables[variableKey]}
                  onVariableSelect={onVariableSelect}
                />
              )
            } else if (column.key === 'orderCode') {
              // 显示生成的订货代码
              value = generatedModel ? (
                <span className="font-mono text-sm bg-green-50 px-2 py-1 rounded">
                  {generatedModel}
                </span>
              ) : (
                <span className="text-gray-400 text-sm">请先选择所有参数</span>
              )
            } else if (column.key === 'model') {
              // 特殊处理产品型号 - 支持链接跳转
              value = (
                <ClickableModelCell
                  model={product.model}
                  modelLink={product.modelLink}
                  className="text-sm"
                />
              )
            } else if (column.key === 'pricing.unitPrice') {
              // 特殊处理移动端弹出框中的价格显示
              const priceValue = getNestedValue(product, column.key)
              const controlMethod = selectedVariables.controlMethod

              if (typeof priceValue === 'number') {
                if (!shouldShowPrice(controlMethod)) {
                  value = (
                    <div className="text-sm">
                      <div className="text-gray-400 text-xs leading-tight">
                        系统只显示Onoff产品价格，调光产品价格请咨询销售人员
                      </div>
                    </div>
                  )
                } else {
                  const priceText = `￥${priceValue.toFixed(2)}`
                  value = (
                    <div className="text-sm">
                      <div>{priceText}</div>
                      <div className="text-gray-400 text-xs mt-0.5">Onoff产品价格</div>
                    </div>
                  )
                }
              } else {
                value = <span className="text-gray-400 text-sm">价格待定</span>
              }
            } else {
              // 使用现有的renderCell方法
              value = renderCell(product, column)
            }

            return (
              <div key={column.key} className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {column.label}
                </label>
                <div className="text-sm text-gray-900">
                  {value}
                </div>
              </div>
            )
          })}
        </div>

        {/* 添加到项目清单按钮 */}
        <div className="pt-3 sm:pt-4 border-t">
          <button
            type="button"
            onClick={handleMobileAddToProject}
            disabled={!generatedModel || generatedModel.trim() === ''}
            className={`
              relative w-full py-3 sm:py-3 px-4 rounded-lg text-sm sm:text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] overflow-hidden
              ${generatedModel && generatedModel.trim() !== ''
                ? 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
            title={
              generatedModel && generatedModel.trim() !== ''
                ? `添加 ${product.name || product.model} 到项目清单`
                : '请先选择所有产品参数'
            }
          >
            <div className="flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="text-sm">
                {generatedModel && generatedModel.trim() !== ''
                  ? '添加到项目清单'
                  : '请先选择所有参数'
                }
              </span>
            </div>

            {/* +1 动画效果 */}
            {showAnimation && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-green-400 font-bold text-lg mobile-add-animation">
                  +1
                </div>
              </div>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
