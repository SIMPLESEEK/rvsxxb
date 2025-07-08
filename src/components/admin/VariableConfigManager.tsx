'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { VariableConfig, VariableType } from '@/types/product'
import { Plus, Edit, Trash2, Settings, Eye, EyeOff, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'

export function VariableConfigManager() {
  const [configs, setConfigs] = useState<VariableConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingConfig, setEditingConfig] = useState<VariableConfig | null>(null)

  const [error, setError] = useState('')

  // 变量类型选项 - 只保留4个核心变量类型
  const variableTypeOptions = [
    { value: 'colorTemperature', label: '色温' },
    { value: 'beamAngle', label: '光束角' },
    { value: 'appearanceColor', label: '外观颜色' },
    { value: 'controlMethod', label: '控制方式' }
  ]

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/variable-configs', {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '获取变量配置失败')
      }

      const data = await response.json()
      console.log('加载的变量配置:', data)
      setConfigs(data.configs || [])
    } catch (error) {
      console.error('加载变量配置失败:', error)
      setError(error instanceof Error ? error.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveConfig = async (configData: Partial<VariableConfig>) => {
    try {
      setIsLoading(true)
      
      const url = editingConfig 
        ? `/api/admin/variable-configs/${editingConfig._id}`
        : '/api/admin/variable-configs'
      
      const method = editingConfig ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API错误响应:', errorData)
        throw new Error(errorData.error || `保存失败 (${response.status})`)
      }

      await loadConfigs()
      setEditingConfig(null)
      setShowAddForm(false)
      setError('')
    } catch (error) {
      console.error('保存变量配置失败:', error)
      setError(error instanceof Error ? error.message : '保存失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('确定要删除这个变量配置吗？')) {
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/admin/variable-configs/${configId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '删除失败')
      }

      await loadConfigs()
      setError('')
    } catch (error) {
      console.error('删除变量配置失败:', error)
      setError(error instanceof Error ? error.message : '删除失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (config: VariableConfig) => {
    try {
      await handleSaveConfig({
        ...config,
        isActive: !config.isActive
      })
    } catch (error) {
      console.error('切换状态失败:', error)
    }
  }

  if (isLoading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">变量配置管理</h3>
          <p className="text-sm text-gray-600">
            管理产品的变量类型和可选项，支持色温、光束角、外观颜色、控制方式、功率等级、安装方式等
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                setIsLoading(true)
                const response = await fetch('/api/admin/debug/variable-configs', {
                  method: 'POST',
                  credentials: 'include'
                })
                if (response.ok) {
                  await loadConfigs()
                  setError('')
                } else {
                  const errorData = await response.json()
                  setError(errorData.error || '重置失败')
                }
              } catch (error) {
                console.error('重置配置失败:', error)
                setError('重置配置失败')
              } finally {
                setIsLoading(false)
              }
            }}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            重置配置
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            添加变量配置
          </Button>
        </div>
      </div>

      {/* 配置列表 */}
      <div className="grid gap-6">
        {configs.map((config) => (
          <div
            key={config._id}
            className={`
              border rounded-lg p-6 transition-all
              ${config.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`
                  w-3 h-3 rounded-full
                  ${config.isActive ? 'bg-green-500' : 'bg-gray-400'}
                `} />
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {config.label}
                  </h4>
                  <p className="text-sm text-gray-600">
                    类型: {variableTypeOptions.find(opt => opt.value === config.type)?.label}
                    {config.isRequired && ' • 必选'}
                    {config.allowMultiple && ' • 多选'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(config)}
                  className="flex items-center gap-1"
                >
                  {config.isActive ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      禁用
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      启用
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingConfig(config)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteConfig(config._id!)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </Button>
              </div>
            </div>

            {/* 选项列表 */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">可选项 ({config.options.length})</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {config.options.map((option, index) => (
                  <div
                    key={index}
                    className={`
                      px-3 py-2 rounded-md text-sm border
                      ${option.isDefault 
                        ? 'bg-blue-50 border-blue-200 text-blue-800' 
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                      }
                    `}
                  >
                    <div className="font-medium">{option.value}</div>
                    <div className="text-xs opacity-75">代码: {option.code}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {configs.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无变量配置</h3>
          <p className="text-gray-600 mb-6">
            开始创建第一个变量配置来管理产品变量
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            添加变量配置
          </Button>
        </div>
      )}

      {/* 添加/编辑表单模态框 */}
      {(showAddForm || editingConfig) && (
        <VariableConfigForm
          config={editingConfig}
          variableTypeOptions={variableTypeOptions}
          onSave={handleSaveConfig}
          onCancel={() => {
            setShowAddForm(false)
            setEditingConfig(null)
            setError('')
          }}
          error={error}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

// 变量配置表单组件
interface VariableConfigFormProps {
  config?: VariableConfig | null
  variableTypeOptions: Array<{value: string, label: string}>
  onSave: (config: Partial<VariableConfig>) => Promise<void>
  onCancel: () => void
  error: string
  isLoading: boolean
}

function VariableConfigForm({
  config,
  variableTypeOptions,
  onSave,
  onCancel,
  error,
  isLoading
}: VariableConfigFormProps) {
  const [formData, setFormData] = useState({
    type: config?.type || 'colorTemperature',
    label: config?.label || '',
    isRequired: config?.isRequired || false,
    allowMultiple: config?.allowMultiple || false,
    isActive: config?.isActive !== false,
    order: config?.order || 999,
    options: config?.options || []
  })

  const [newOption, setNewOption] = useState({ value: '', code: '', isDefault: false })

  const handleAddOption = () => {
    if (newOption.value.trim() && newOption.code.trim()) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { ...newOption }]
      }))
      setNewOption({ value: '', code: '', isDefault: false })
    }
  }

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  // 上移选项
  const handleMoveOptionUp = (index: number) => {
    if (index === 0) return

    setFormData(prev => {
      const newOptions = [...prev.options]
      const temp = newOptions[index]
      newOptions[index] = newOptions[index - 1]
      newOptions[index - 1] = temp

      // 更新order值
      newOptions.forEach((option, i) => {
        option.order = i + 1
      })

      return {
        ...prev,
        options: newOptions
      }
    })
  }

  // 下移选项
  const handleMoveOptionDown = (index: number) => {
    setFormData(prev => {
      if (index === prev.options.length - 1) return prev

      const newOptions = [...prev.options]
      const temp = newOptions[index]
      newOptions[index] = newOptions[index + 1]
      newOptions[index + 1] = temp

      // 更新order值
      newOptions.forEach((option, i) => {
        option.order = i + 1
      })

      return {
        ...prev,
        options: newOptions
      }
    })
  }

  // 智能排序选项
  const handleAutoSort = () => {
    setFormData(prev => {
      const newOptions = [...prev.options]

      // 根据变量类型进行智能排序
      switch (formData.type) {
        case 'colorTemperature':
          // 色温按数值排序：2500K, 2700K, 3000K, 3500K, 4000K, 5000K, 6500K, 色温可调
          newOptions.sort((a, b) => {
            const getColorTempValue = (value: string) => {
              if (value.includes('可调') || value.includes('TW')) return 9999
              const match = value.match(/(\d+)K?/)
              return match ? parseInt(match[1]) : 0
            }
            return getColorTempValue(a.value) - getColorTempValue(b.value)
          })
          break

        case 'beamAngle':
          // 光束角按数值排序：10°, 12°, 15°, 24°, 36°, 60°
          newOptions.sort((a, b) => {
            const getAngleValue = (value: string) => {
              const match = value.match(/(\d+)/)
              return match ? parseInt(match[1]) : 0
            }
            return getAngleValue(a.value) - getAngleValue(b.value)
          })
          break

        case 'appearanceColor':
        case 'controlMethod':
        default:
          // 外观颜色和控制方式按中文字母顺序排序
          newOptions.sort((a, b) => a.value.localeCompare(b.value, 'zh-CN'))
      }

      // 更新order值
      newOptions.forEach((option, i) => {
        option.order = i + 1
      })

      return {
        ...prev,
        options: newOptions
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.options.length === 0) {
      alert('请至少添加一个选项')
      return
    }

    // 准备提交的数据，确保不包含 _id 等不可修改字段
    let submitData
    if (config) {
      // 编辑模式：只提交表单数据，不包含原始 config 中的 _id 等字段
      submitData = { ...formData }
    } else {
      // 新建模式：直接使用表单数据
      submitData = formData
    }

    console.log('提交的数据:', submitData)

    await onSave(submitData)
  }

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {config ? '编辑变量配置' : '添加变量配置'}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  变量类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as VariableType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {variableTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  显示标签
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：色温"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  显示顺序
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 999 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="999"
                  min="1"
                  max="9999"
                />
              </div>
            </div>

            {/* 选项设置 */}
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                  className="mr-2"
                />
                必选项
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allowMultiple}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowMultiple: e.target.checked }))}
                  className="mr-2"
                />
                允许多选
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                启用
              </label>
            </div>

            {/* 选项管理 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  可选项
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoSort}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  title="智能排序"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  排序
                </Button>
              </div>

              {/* 添加新选项 */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newOption.value}
                  onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="选项值"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newOption.code}
                  onChange={(e) => setNewOption(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="代码"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newOption.isDefault}
                    onChange={(e) => setNewOption(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="mr-1"
                  />
                  默认
                </label>
                <Button type="button" onClick={handleAddOption} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* 选项列表 */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 font-mono w-6">{index + 1}.</span>
                      <span className="font-medium">{option.value}</span>
                      <span className="text-sm text-gray-500">({option.code})</span>
                      {option.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">默认</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveOptionUp(index)}
                        disabled={index === 0}
                        className="text-gray-600 hover:text-gray-700 disabled:opacity-50"
                        title="上移"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveOptionDown(index)}
                        disabled={index === formData.options.length - 1}
                        className="text-gray-600 hover:text-gray-700 disabled:opacity-50"
                        title="下移"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-600 hover:text-red-700"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
