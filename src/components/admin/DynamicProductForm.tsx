'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Product, ColumnConfig } from '@/types/product'
import { X, Upload } from 'lucide-react'

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
  const fileInputRefs = useRef<{ [key: string]: React.RefObject<HTMLInputElement> }>({})

  // 获取列配置
  useEffect(() => {
    fetchColumns()
  }, [])

  // 初始化表单数据
  useEffect(() => {
    if (columns.length > 0) {
      initializeFormData()
    }
  }, [columns, product])

  const fetchColumns = async () => {
    try {
      const response = await fetch('/api/admin/columns', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // 按order排序，只显示管理员可见的列
        const adminColumns = data.columns
          .filter((col: ColumnConfig) => col.roles.includes('admin'))
          .sort((a: ColumnConfig, b: ColumnConfig) => a.order - b.order)
        setColumns(adminColumns)
      }
    } catch (error) {
      console.error('获取列配置失败:', error)
    } finally {
      setIsLoadingColumns(false)
    }
  }

  const initializeFormData = () => {
    const initialData: any = {}
    
    columns.forEach(col => {
      const value = getNestedValue(product, col.key)
      setNestedValue(initialData, col.key, value || getDefaultValue(col))
    })

    // 确保必要的字段存在
    if (!initialData.isActive) initialData.isActive = true
    if (!initialData.isNew) initialData.isNew = false
    if (!initialData.order) initialData.order = 999

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
    setFormData(newFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证必填字段
    const requiredFields = ['productType', 'model']
    const missingFields = requiredFields.filter(field => !getNestedValue(formData, field))
    
    if (missingFields.length > 0) {
      alert(`请填写必填字段: ${missingFields.join(', ')}`)
      return
    }

    const submitData = {
      ...formData,
      id: product?._id || product?.id
    }
    
    await onSubmit(submitData)
  }

  const handleImageUpload = async (file: File, columnKey: string) => {
    try {
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
        return (
          <div key={col.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {col.label} {isRequired && '*'}
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={value || ''}
                onChange={(e) => handleInputChange(col.key, e.target.value)}
                placeholder="图片URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRefs.current[col.key]}
                  style={{ display: 'none' }}
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
                >
                  <Upload className="h-4 w-4" />
                  上传图片
                </Button>
                {value && (
                  <img
                    src={value}
                    alt={col.label}
                    className="w-16 h-16 object-contain border rounded cursor-pointer"
                    onClick={() => window.open(value, '_blank')}
                  />
                )}
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
        return (
          <div key={col.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {col.label} {isRequired && '*'}
            </label>
            <input
              type="number"
              value={value || 0}
              onChange={(e) => handleInputChange(col.key, Number(e.target.value))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isRequired && !value ? 'border-red-300 bg-red-50' : ''
              }`}
            />
          </div>
        )

      default:
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

  if (isLoadingColumns) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {product ? '编辑产品' : '添加产品'}
          </h2>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {columns.map(col => renderFormField(col))}
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

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
