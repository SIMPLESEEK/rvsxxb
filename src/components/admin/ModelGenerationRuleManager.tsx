'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { ModelGenerationRule } from '@/types/product'
import { Plus, Edit, Trash2, Code, Star, Eye, EyeOff, TestTube } from 'lucide-react'

export function ModelGenerationRuleManager() {
  const [rules, setRules] = useState<ModelGenerationRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<ModelGenerationRule | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/model-generation-rules', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取型号生成规则失败')
      }

      const data = await response.json()
      setRules(data.rules || [])
    } catch (error) {
      console.error('加载型号生成规则失败:', error)
      setError(error instanceof Error ? error.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveRule = async (ruleData: Partial<ModelGenerationRule>) => {
    try {
      setIsLoading(true)
      
      const url = editingRule 
        ? `/api/admin/model-generation-rules/${editingRule._id}`
        : '/api/admin/model-generation-rules'
      
      const method = editingRule ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ruleData),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '保存失败')
      }

      await loadRules()
      setEditingRule(null)
      setShowAddForm(false)
      setError('')
    } catch (error) {
      console.error('保存型号生成规则失败:', error)
      setError(error instanceof Error ? error.message : '保存失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('确定要删除这个型号生成规则吗？')) {
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/admin/model-generation-rules/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '删除失败')
      }

      await loadRules()
      setError('')
    } catch (error) {
      console.error('删除型号生成规则失败:', error)
      setError(error instanceof Error ? error.message : '删除失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (rule: ModelGenerationRule) => {
    try {
      await handleSaveRule({
        ...rule,
        isActive: !rule.isActive
      })
    } catch (error) {
      console.error('切换状态失败:', error)
    }
  }

  const handleSetDefault = async (rule: ModelGenerationRule) => {
    try {
      await handleSaveRule({
        ...rule,
        isDefault: true
      })
    } catch (error) {
      console.error('设置默认规则失败:', error)
    }
  }

  const handleTestRule = async (rule: ModelGenerationRule) => {
    try {
      const testData = {
        baseModel: 'RDU-T55',
        variables: {
          colorTemperature: '3000K',
          beamAngle: '24°',
          appearanceColor: '白色',
          controlMethod: 'DALI'
        },
        ruleId: rule._id
      }

      const response = await fetch('/api/admin/model-generation-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('测试失败')
      }

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      console.error('测试规则失败:', error)
      setError(error instanceof Error ? error.message : '测试失败')
    }
  }

  if (isLoading && rules.length === 0) {
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

      {/* 测试结果 */}
      {testResult && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h4 className="font-medium text-green-800 mb-2">测试结果</h4>
          <div className="text-sm text-green-700">
            <p>基础型号: {testResult.baseModel}</p>
            <p>变量参数: {JSON.stringify(testResult.variables)}</p>
            <p className="font-medium">生成型号: {testResult.generatedModel}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTestResult(null)}
            className="mt-2"
          >
            关闭
          </Button>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">型号生成规则管理</h3>
          <p className="text-sm text-gray-600">
            配置产品型号的自动生成规则，支持多种模板格式和变量映射
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          添加生成规则
        </Button>
      </div>

      {/* 规则列表 */}
      <div className="grid gap-6">
        {rules.map((rule) => (
          <div
            key={rule._id}
            className={`
              border rounded-lg p-6 transition-all
              ${rule.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'}
              ${rule.isDefault ? 'ring-2 ring-blue-200' : ''}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`
                  w-3 h-3 rounded-full
                  ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}
                `} />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      {rule.name}
                    </h4>
                    {rule.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Star className="h-3 w-3" />
                        默认
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {rule.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestRule(rule)}
                  className="flex items-center gap-1"
                >
                  <TestTube className="h-4 w-4" />
                  测试
                </Button>
                {!rule.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(rule)}
                    className="flex items-center gap-1"
                  >
                    <Star className="h-4 w-4" />
                    设为默认
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(rule)}
                  className="flex items-center gap-1"
                >
                  {rule.isActive ? (
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
                  onClick={() => setEditingRule(rule)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteRule(rule._id!)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </Button>
              </div>
            </div>

            {/* 模板显示 */}
            <div className="bg-gray-50 rounded-md p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">模板格式</h5>
              <code className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border">
                {rule.template}
              </code>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {rules.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无生成规则</h3>
          <p className="text-gray-600 mb-6">
            创建第一个型号生成规则来自动生成产品型号
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            添加生成规则
          </Button>
        </div>
      )}
    </div>
  )
}
