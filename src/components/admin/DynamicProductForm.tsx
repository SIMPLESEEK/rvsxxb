'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Product, ColumnConfig, VariableConfig, VariableType } from '@/types/product'
import { X, Upload, Clipboard, Save } from 'lucide-react'
import { calculateMarketPrice } from '@/lib/utils'

interface DynamicProductFormProps {
  product?: Product | null
  onSubmit: (productData: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function DynamicProductForm({ product, onSubmit, onCancel, isLoading }: DynamicProductFormProps) {
  const [formData, setFormData] = useState<any>({})
  const [columns, setColumns] = useState<ColumnConfig[]>([])
  const [isLoadingColumns, setIsLoadingColumns] = useState(true)
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({})
  const fileInputRefs = useRef<{ [key: string]: React.RefObject<HTMLInputElement | null> }>({})

  // 新增：变量配置相关状态
  const [variableConfigs, setVariableConfigs] = useState<VariableConfig[]>([])
  const [productVariables, setProductVariables] = useState<{
    [key in VariableType]?: string[]
  }>({
    colorTemperature: [],
    beamAngle: [],
    appearanceColor: [],
    controlMethod: []
  })
  const [showModelLinkInput, setShowModelLinkInput] = useState(false)

  const fetchColumns = async () => {
    try {
      const response = await fetch('/api/admin/columns', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // 显示所有管理员可见的列（包括不显示的列），排除变量列和特殊列
        const adminColumns = data.columns
          .filter((col: ColumnConfig) =>
            col.roles.includes('admin') &&
            // 排除变量类型的列（这些通过变量配置部分处理）
            col.type !== 'variable' &&
            // 排除特殊的添加按钮列
            col.type !== 'action' &&
            // 排除订货代码列（这是生成的列）
            col.type !== 'generated'
          )
          .sort((a: ColumnConfig, b: ColumnConfig) => a.order - b.order)
        setColumns(adminColumns)
      } else {
        // 如果API失败，使用默认列配置
        console.warn('API获取列配置失败，使用默认配置')
        setColumns(getDefaultColumns())
      }
    } catch (error) {
      console.error('获取列配置失败:', error)
      // 如果网络错误，使用默认列配置
      console.warn('网络错误，使用默认列配置')
      setColumns(getDefaultColumns())
    } finally {
      setIsLoadingColumns(false)
    }
  }

  // 默认列配置（当数据库不可用时使用）
  const getDefaultColumns = (): ColumnConfig[] => {
    return [
      // 基础产品信息列
      { _id: '1', key: 'order', label: '显示顺序', type: 'number', roles: ['admin'], order: 1, isVisible: true, width: '3%', bg: '#e6f7e6' },
      { _id: '2', key: 'productType', label: '产品类型', type: 'text', roles: ['admin'], order: 2, isVisible: true, width: '6%', bg: '#e6f7e6' },
      { _id: '3', key: 'brand', label: '品牌', type: 'text', roles: ['admin'], order: 3, isVisible: true, width: '4%', bg: '#e6f7e6' },
      { _id: '4', key: 'model', label: '产品型号', type: 'text', roles: ['admin'], order: 4, isVisible: true, width: '8%', bg: '#e6f7e6' },
      { _id: '5', key: 'images.display', label: '产品图', type: 'image', roles: ['admin'], order: 5, isVisible: true, width: '6%', bg: '#e6f7e6' },
      { _id: '6', key: 'images.dimension', label: '尺寸图', type: 'image', roles: ['admin'], order: 6, isVisible: true, width: '6%', bg: '#e6f7e6' },
      { _id: '7', key: 'images.accessories', label: '配件图', type: 'image', roles: ['admin'], order: 7, isVisible: true, width: '6%', bg: '#e6f7e6' },
      { _id: '8', key: 'specifications.detailed', label: '技术参数', type: 'multiline', roles: ['admin'], order: 8, isVisible: true, width: '10%', bg: '#e6f7e6' },
      { _id: '9', key: 'appearance.installation', label: '安装方式', type: 'text', roles: ['admin'], order: 9, isVisible: true, width: '5%', bg: '#e6f7e6' },
      { _id: '10', key: 'appearance.cutoutSize', label: '开孔尺寸', type: 'text', roles: ['admin'], order: 10, isVisible: true, width: '4%', bg: '#e6f7e6' },
      { _id: '11', key: 'productremark', label: '产品备注', type: 'text', roles: ['admin'], order: 11, isVisible: true, width: '5%', bg: '#e6f7e6' },
      { _id: '12', key: 'pricing.unitPrice', label: '含税价格', type: 'number', roles: ['admin'], order: 12, isVisible: true, width: '4%', bg: '#e6f7e6' },
      { _id: '13', key: 'pricing.marketPrice', label: '市场价格', type: 'number', roles: ['admin'], order: 13, isVisible: true, width: '4%', bg: '#e6f7e6' },
      { _id: '14', key: 'pricing.deliveryTime', label: '预计交货', type: 'number', roles: ['admin'], order: 14, isVisible: true, width: '5%', bg: '#e6f7e6' },
      { _id: '15', key: 'specifications.chip', label: '芯片', type: 'text', roles: ['admin'], order: 15, isVisible: true, width: '4%', bg: '#e6f7e6' },
      { _id: '16', key: 'specifications.driver', label: '驱动', type: 'text', roles: ['admin'], order: 16, isVisible: true, width: '4%', bg: '#e6f7e6' },
      // 管理员专用的供应商和成本相关列
      { _id: '17', key: 'vendorBody1', label: '套件1', type: 'text', roles: ['admin'], order: 100, isVisible: false, width: '5%', bg: '#ffe7e7' },
      { _id: '18', key: 'costBody1', label: '套件1成本', type: 'number', roles: ['admin'], order: 101, isVisible: false, width: '4%', bg: '#ffe7e7' },
      { _id: '19', key: 'vendorBody2', label: '套件2', type: 'text', roles: ['admin'], order: 102, isVisible: false, width: '5%', bg: '#ffe7e7' },
      { _id: '20', key: 'costBody2', label: '套件2成本', type: 'number', roles: ['admin'], order: 103, isVisible: false, width: '4%', bg: '#ffe7e7' },
      { _id: '21', key: 'vendorLED', label: '芯片供应商', type: 'text', roles: ['admin'], order: 104, isVisible: false, width: '5%', bg: '#f8f9fa' },
      { _id: '22', key: 'costLED', label: '芯片成本', type: 'number', roles: ['admin'], order: 105, isVisible: false, width: '4%', bg: '#ffe7e7' },
      { _id: '23', key: 'vendorDriver', label: '驱动供应商', type: 'text', roles: ['admin'], order: 106, isVisible: false, width: '5%', bg: '#f8f9fa' },
      { _id: '24', key: 'costDriver', label: '驱动成本', type: 'number', roles: ['admin'], order: 107, isVisible: false, width: '4%', bg: '#ffe7e7' },
      { _id: '25', key: 'vendorLabel', label: '标贴品牌', type: 'text', roles: ['admin'], order: 108, isVisible: false, width: '5%', bg: '#ffe7e7' },
      { _id: '26', key: 'Label', label: '标贴内容', type: 'multiline', roles: ['admin'], order: 109, isVisible: false, width: '8%', bg: '#ffe7e7' },
      { _id: '27', key: 'vendorAssemble', label: '组装', type: 'text', roles: ['admin'], order: 110, isVisible: false, width: '5%', bg: '#ffe7e7' },
      { _id: '28', key: 'costAssemble', label: '组装成本', type: 'number', roles: ['admin'], order: 111, isVisible: false, width: '4%', bg: '#ffe7e7' },
      { _id: '29', key: 'vendorOther', label: '其他部件', type: 'text', roles: ['admin'], order: 112, isVisible: false, width: '5%', bg: '#ffe7e7' },
      { _id: '30', key: 'costOther', label: '其他成本', type: 'number', roles: ['admin'], order: 113, isVisible: false, width: '4%', bg: '#ffe7e7' },
      { _id: '31', key: 'vendorODM', label: '整灯外购', type: 'text', roles: ['admin'], order: 114, isVisible: false, width: '5%', bg: '#ffe7e7' },
      { _id: '32', key: 'costODM', label: '整灯外购成本', type: 'number', roles: ['admin'], order: 115, isVisible: false, width: '4%', bg: '#ffe7e7' }
    ]
  }

  // 新增：加载变量配置
  const loadVariableConfigs = async () => {
    try {
      const response = await fetch('/api/admin/variable-configs?active=true', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setVariableConfigs(data.configs || [])
      } else {
        // 如果API失败，使用默认变量配置
        console.warn('API获取变量配置失败，使用默认配置')
        setVariableConfigs(getDefaultVariableConfigs())
      }
    } catch (error) {
      console.error('加载变量配置失败:', error)
      // 如果网络错误，使用默认变量配置
      console.warn('网络错误，使用默认变量配置')
      setVariableConfigs(getDefaultVariableConfigs())
    }
  }

  // 默认变量配置（当数据库不可用时使用）
  const getDefaultVariableConfigs = (): VariableConfig[] => {
    return [
      {
        _id: '1',
        type: 'colorTemperature',
        label: '色温',
        options: [
          { value: '2700K', code: '27', isDefault: false, order: 1 },
          { value: '3000K', code: '30', isDefault: true, order: 2 },
          { value: '3500K', code: '35', isDefault: false, order: 3 },
          { value: '4000K', code: '40', isDefault: false, order: 4 },
          { value: '5000K', code: '50', isDefault: false, order: 5 },
          { value: '6500K', code: '65', isDefault: false, order: 6 },
          { value: '色温可调', code: 'TW', isDefault: false, order: 7 }
        ],
        isRequired: true,
        allowMultiple: false,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        type: 'beamAngle',
        label: '光束角',
        options: [
          { value: '15°', code: '15', isDefault: false, order: 1 },
          { value: '24°', code: '24', isDefault: true, order: 2 },
          { value: '36°', code: '36', isDefault: false, order: 3 },
          { value: '60°', code: '60', isDefault: false, order: 4 },
          { value: '120°', code: '120', isDefault: false, order: 5 }
        ],
        isRequired: true,
        allowMultiple: false,
        order: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '3',
        type: 'appearanceColor',
        label: '外观颜色',
        options: [
          { value: '白色', code: 'W', isDefault: true, order: 1 },
          { value: '黑色', code: 'B', isDefault: false, order: 2 },
          { value: '银色', code: 'S', isDefault: false, order: 3 },
          { value: '金色', code: 'G', isDefault: false, order: 4 }
        ],
        isRequired: true,
        allowMultiple: false,
        order: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '4',
        type: 'controlMethod',
        label: '控制方式',
        options: [
          { value: 'ON/OFF', code: 'O', isDefault: true, order: 1 },
          { value: '0-10V', code: 'V', isDefault: false, order: 2 },
          { value: 'DALI', code: 'D', isDefault: false, order: 3 },
          { value: 'BLE', code: 'B', isDefault: false, order: 4 }
        ],
        isRequired: true,
        allowMultiple: false,
        order: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  const initializeFormData = () => {
    const initialData: any = {}

    columns.forEach(col => {
      let value = getNestedValue(product, col.key)

      // 处理字段名变更：notes -> productremark
      if (col.key === 'productremark' && !value && product?.notes) {
        value = product.notes
      }

      setNestedValue(initialData, col.key, value || getDefaultValue(col))
    })

    // 确保必要的字段存在
    if (!initialData.isActive) initialData.isActive = true
    if (!initialData.isNew) initialData.isNew = false
    if (!initialData.order) initialData.order = 999

    // 确保关键字段有默认值，避免 toLowerCase 错误
    if (!initialData.name) initialData.name = ''
    if (!initialData.model) initialData.model = ''
    if (!initialData.productType) initialData.productType = ''

    // 特殊处理：确保 modelLink 字段被正确初始化（不在标准列配置中）
    if (product?.modelLink) {
      initialData.modelLink = product.modelLink
    }

    // 自动计算市场价格
    const unitPrice = getNestedValue(initialData, 'pricing.unitPrice') || 0
    if (unitPrice > 0) {
      const marketPrice = calculateMarketPrice(unitPrice)
      setNestedValue(initialData, 'pricing.marketPrice', marketPrice)
    }

    // 新增：初始化产品变量选择
    if (product?.productVariables) {
      setProductVariables(product.productVariables)
    } else {
      // 如果是编辑现有产品，尝试从外观颜色和控制方式字段解析
      const initialVariables: { [key in VariableType]?: string[] } = {
        colorTemperature: [],
        beamAngle: [],
        appearanceColor: initialData.appearance?.color ? [initialData.appearance.color] : [],
        controlMethod: initialData.control ? [initialData.control] : []
      }
      setProductVariables(initialVariables)
    }

    setFormData(initialData)
  }

  const getDefaultValue = (col: ColumnConfig) => {
    switch (col.type) {
      case 'number':
        return 0
      case 'image':
        return ''
      case 'multiline':
      case 'singleline':
      case 'text':
        return ''
      default:
        return ''
    }
  }

  const getNestedValue = (obj: any, path: string) => {
    if (!obj) return undefined
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  const handleInputChange = (columnKey: string, value: any) => {
    const newFormData = { ...formData }
    setNestedValue(newFormData, columnKey, value)

    // 如果修改的是含税价格，自动计算市场价格
    if (columnKey === 'pricing.unitPrice') {
      const unitPrice = Number(value) || 0
      const marketPrice = calculateMarketPrice(unitPrice)
      setNestedValue(newFormData, 'pricing.marketPrice', marketPrice)
    }

    setFormData(newFormData)
  }

  // 新增：处理变量选择
  const handleVariableToggle = (variableType: VariableType, optionValue: string) => {
    setProductVariables(prev => {
      const currentOptions = prev[variableType] || []
      const isSelected = currentOptions.includes(optionValue)

      return {
        ...prev,
        [variableType]: isSelected
          ? currentOptions.filter(v => v !== optionValue)
          : [...currentOptions, optionValue]
      }
    })
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }

    // 验证必填字段
    const requiredFields = ['productType', 'model']
    const missingFields = requiredFields.filter(field => !getNestedValue(formData, field))

    if (missingFields.length > 0) {
      alert(`请填写必填字段: ${missingFields.join(', ')}`)
      return
    }

    const submitData = {
      ...formData,
      id: product?._id || product?.id,
      productVariables // 新增：包含产品变量选择
    }

    await onSubmit(submitData)
  }

  const handleImageUpload = async (file: File, columnKey: string) => {
    try {
      // 设置上传状态
      setUploadingImages(prev => ({ ...prev, [columnKey]: true }))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'xxb')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const data = await response.json()
      handleInputChange(columnKey, data.url)
    } catch (error) {
      console.error('图片上传失败:', error)
      alert('图片上传失败，请重试')
    } finally {
      // 清除上传状态
      setUploadingImages(prev => ({ ...prev, [columnKey]: false }))
    }
  }

  // 处理粘贴事件
  const handlePaste = async (e: React.ClipboardEvent, columnKey: string) => {
    const items = e.clipboardData?.items
    if (!items) return

    // 查找图片文件
    let hasImage = false
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        hasImage = true
        e.preventDefault() // 只在有图片时阻止默认行为
        const file = item.getAsFile()
        if (file) {
          await handleImageUpload(file, columnKey)
          return
        }
      }
    }

    // 如果没有图片，检查是否有图片URL
    if (!hasImage) {
      const text = e.clipboardData?.getData('text')
      if (text && (text.startsWith('http') || text.startsWith('data:image'))) {
        // 检查URL是否看起来像图片
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
        const isImageUrl = imageExtensions.some(ext => text.toLowerCase().includes(ext)) || text.startsWith('data:image')

        if (isImageUrl) {
          e.preventDefault()
          handleInputChange(columnKey, text)
        }
      }
    }
  }

  const renderFormField = (col: ColumnConfig) => {
    const value = getNestedValue(formData, col.key)
    const isRequired = ['productType', 'model'].includes(col.key)

    // 初始化文件输入ref
    if (col.type === 'image' && !fileInputRefs.current[col.key]) {
      fileInputRefs.current[col.key] = React.createRef()
    }

    switch (col.type) {
      case 'image':
        const isUploading = uploadingImages[col.key]
        return (
          <div key={col.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {col.label} {isRequired && '*'}
            </label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => handleInputChange(col.key, e.target.value)}
                  onPaste={(e) => handlePaste(e, col.key)}
                  placeholder="图片URL或直接粘贴图片 (Ctrl+V)"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUploading}
                />
                <Clipboard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRefs.current[col.key]}
                  className="hidden"
                  title={`上传${col.label}`}
                  aria-label={`上传${col.label}`}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0], col.key)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRefs.current[col.key]?.current?.click()}
                  className="flex items-center gap-1"
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? '上传中...' : '上传图片'}
                </Button>
                {value && !isUploading && (
                  <img
                    src={value}
                    alt={col.label}
                    className="w-16 h-16 object-contain border rounded cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(value, '_blank')}
                  />
                )}
                {isUploading && (
                  <div className="w-16 h-16 border border-gray-300 rounded flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                支持粘贴图片文件或图片URL，也可以点击上传按钮选择文件
              </div>
            </div>
          </div>
        )

      case 'multiline':
        return (
          <div key={col.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {col.label} {isRequired && '*'}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => handleInputChange(col.key, e.target.value)}
              rows={4}
              placeholder={`请输入${col.label}，支持换行`}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isRequired && !value ? 'border-red-300 bg-red-50' : ''
              }`}
            />
          </div>
        )

      case 'number':
        // 市场价格字段设为只读并自动计算
        const isMarketPrice = col.key === 'pricing.marketPrice'
        const isUnitPrice = col.key === 'pricing.unitPrice'
        return (
          <div key={col.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {col.label} {isRequired && '*'}
              {isMarketPrice && <span className="text-xs text-gray-500 ml-1">(自动计算)</span>}
              {isUnitPrice && <span className="text-xs text-gray-500 ml-1">(Onoff产品价格)</span>}
            </label>
            <input
              type="number"
              step="0.01"
              value={value || 0}
              onChange={isMarketPrice ? undefined : (e) => handleInputChange(col.key, Number(e.target.value))}
              readOnly={isMarketPrice}
              placeholder={isMarketPrice ? '根据含税价格自动计算' : `请输入${col.label}`}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isRequired && !value ? 'border-red-300 bg-red-50' : ''
              } ${isMarketPrice ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
            />
          </div>
        )

      default:
        // 特殊处理产品型号字段，添加链接设置功能
        if (col.key === 'model') {
          return (
            <div key={col.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {col.label} {isRequired && '*'}
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => handleInputChange(col.key, e.target.value)}
                  placeholder={`请输入${col.label}`}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isRequired && !value ? 'border-red-300 bg-red-50' : ''
                  }`}
                />
                {/* 产品型号链接设置 - 增强视觉提示 */}
                <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">超链接设置</span>
                      {getNestedValue(formData, 'modelLink') ? (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ 已设置
                          </span>
                          <button
                            type="button"
                            onClick={() => window.open(getNestedValue(formData, 'modelLink'), '_blank')}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            测试链接
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          未设置
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowModelLinkInput(!showModelLinkInput)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {showModelLinkInput ? '收起' : (getNestedValue(formData, 'modelLink') ? '编辑' : '设置')}
                    </button>
                  </div>

                  {showModelLinkInput && (
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={getNestedValue(formData, 'modelLink') || ''}
                        onChange={(e) => handleInputChange('modelLink', e.target.value)}
                        placeholder="请输入产品型号链接地址（如：产品详情页、规格书等）"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500">
                        设置后，用户在产品选择表中点击产品型号时将跳转到此链接
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }

        return (
          <div key={col.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {col.label} {isRequired && '*'}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleInputChange(col.key, e.target.value)}
              placeholder={`请输入${col.label}`}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isRequired && !value ? 'border-red-300 bg-red-50' : ''
              }`}
            />
          </div>
        )
    }
  }

  // 获取列配置和变量配置
  useEffect(() => {
    fetchColumns()
    loadVariableConfigs()
  }, [])

  // 初始化表单数据
  useEffect(() => {
    if (columns.length > 0) {
      initializeFormData()
    }
  }, [columns, product])

  // 初始化链接输入框显示状态
  useEffect(() => {
    if (product?.modelLink) {
      setShowModelLinkInput(true)
    }
  }, [product])

  if (isLoadingColumns) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          <div className="text-center">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? '编辑产品' : '添加产品'}
          </h2>
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 text-blue-600 border-blue-300 hover:bg-blue-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? '保存中...' : '保存'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {columns.map(col => renderFormField(col))}
          </div>

          {/* 产品变量选择 */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-4">产品变量配置</h3>
            <p className="text-sm text-gray-600 mb-6">
              为此产品选择支持的变量选项。用户在产品选型时只能从您选择的选项中进行选择。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {variableConfigs.map((config) => (
                <div key={config.type} className="space-y-3">
                  <h4 className="font-medium text-gray-700">{config.label}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {config.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={productVariables[config.type]?.includes(option.value) || false}
                          onChange={() => handleVariableToggle(config.type, option.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">{option.value}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    已选择 {productVariables[config.type]?.length || 0} 个选项
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 状态选项 */}
          <div className="flex items-center space-x-6 pt-4 border-t">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive || false}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="mr-2"
              />
              启用产品（在选型表中显示）
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isNew || false}
                onChange={(e) => handleInputChange('isNew', e.target.checked)}
                className="mr-2"
              />
              新产品（显示NEW标记）
            </label>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
