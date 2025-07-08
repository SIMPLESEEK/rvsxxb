'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Trash2, AlertTriangle, Database, RefreshCw, CheckCircle, Home } from 'lucide-react'

interface CleanupStats {
  products: number
  baseProducts: number
  productVariants: number
  projectListSaves: number
}

interface ClearResults {
  success: boolean
  message: string
  details?: string
  deletedProducts?: number
  deletedBaseProducts?: number
  deletedProductVariants?: number
  deletedProjectListSaves?: number
}

export default function DataCleanupPage() {
  const router = useRouter()
  const [stats, setStats] = useState<CleanupStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [clearResults, setClearResults] = useState<ClearResults | null>(null)

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/data-stats', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllData = async () => {
    if (!confirm('⚠️ 警告：此操作将删除所有产品相关数据，包括：\n\n• 所有产品记录\n• 所有基础产品\n• 所有产品变量组合\n• 所有项目清单保存\n\n此操作不可撤销！确定要继续吗？')) {
      return
    }

    if (!confirm('🔴 最后确认：您真的要删除所有产品数据吗？\n\n请再次确认，此操作无法撤销！')) {
      return
    }

    setIsClearing(true)
    try {
      const response = await fetch('/api/admin/clear-all-data', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setClearResults(data)
        await loadStats() // 重新加载统计数据
      } else {
        const error = await response.json()
        alert(`清理失败: ${error.error}`)
      }
    } catch (error) {
      console.error('清理数据失败:', error)
      alert('清理数据失败，请稍后重试')
    } finally {
      setIsClearing(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b admin-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/products-v2')}
                  className="flex items-center gap-2 mr-4"
                >
                  <Home className="h-4 w-4" />
                  返回产品管理
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Database className="h-8 w-8 text-red-600" />
                    数据清理工具
                  </h1>
                  <p className="mt-2 text-gray-600">
                    清理旧的产品数据，为新的变量系统做准备
                  </p>
                </div>
              </div>

              <Button
                onClick={loadStats}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                刷新统计
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 警告提示 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-red-900 mb-2">重要警告</h3>
              <div className="text-red-800 space-y-2">
                <p>• 此工具将<strong>永久删除</strong>所有现有的产品数据</p>
                <p>• 包括产品记录、基础产品、变量组合和项目清单</p>
                <p>• 删除后无法恢复，请确保您已经备份了重要数据</p>
                <p>• 建议在清理前先导出重要的产品信息</p>
              </div>
            </div>
          </div>
        </div>

        {/* 数据统计 */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-gray-900">当前数据统计</h2>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载中...</span>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.products}</div>
                  <div className="text-sm text-blue-800">产品记录</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.baseProducts}</div>
                  <div className="text-sm text-green-800">基础产品</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.productVariants}</div>
                  <div className="text-sm text-purple-800">产品变量组合</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.projectListSaves}</div>
                  <div className="text-sm text-orange-800">项目清单保存</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                无法加载统计数据
              </div>
            )}
          </div>
        </div>

        {/* 清理结果 */}
        {clearResults && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-green-900 mb-2">清理完成</h3>
                <div className="text-green-800 space-y-1">
                  <p>• 删除了 {clearResults.deletedProducts} 个产品记录</p>
                  <p>• 删除了 {clearResults.deletedBaseProducts} 个基础产品</p>
                  <p>• 删除了 {clearResults.deletedProductVariants} 个产品变量组合</p>
                  <p>• 删除了 {clearResults.deletedProjectListSaves} 个项目清单保存</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-gray-900">清理操作</h2>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={clearAllData}
                disabled={isClearing || !stats}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    清理中...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    清空所有产品数据
                  </>
                )}
              </Button>
              
              <div className="flex-1 text-sm text-gray-600 flex items-center">
                清理完成后，您可以使用新的变量系统重新添加产品
              </div>
            </div>
          </div>
        </div>

        {/* 后续步骤 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">清理后的建议步骤</h3>
          <div className="space-y-2 text-blue-800">
            <p>1. 访问 <a href="/admin/product-model-settings" className="underline font-medium">产品变量设置</a> 配置变量参数</p>
            <p>2. 在 <a href="/admin/base-products" className="underline font-medium">基础产品管理</a> 中创建新的基础产品</p>
            <p>3. 使用 <a href="/product-list-v3" className="underline font-medium">新版产品选型表</a> 体验变量选择功能</p>
            <p>4. 通过变量系统批量生成产品型号和变量组合</p>
          </div>
        </div>
      </div>
    </div>
  )
}
