'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { VariableConfigManager } from '@/components/admin/VariableConfigManager'
import { ModelGenerationRuleManager } from '@/components/admin/ModelGenerationRuleManager'
import { Settings, Database, Code, Home, Loader2 } from 'lucide-react'

type TabType = 'variables' | 'rules'

export default function ProductModelSettingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('variables')
  // const [isLoading, setIsLoading] = useState(false)

  // 权限检查
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/product-list-v3')
    }
  }, [user, authLoading, router])

  // 如果正在加载或没有权限，显示加载状态
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  const tabs = [
    {
      id: 'variables' as TabType,
      label: '变量配置',
      icon: Settings,
      description: '管理产品变量类型和选项'
    },
    {
      id: 'rules' as TabType,
      label: '型号生成规则',
      icon: Code,
      description: '配置产品型号自动生成规则'
    }
  ]

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
                    <Database className="h-8 w-8 text-blue-600" />
                    产品型号设置
                  </h1>
                  <p className="mt-2 text-gray-600">
                    配置产品变量参数和型号生成规则，支持灵活的产品变量组合管理
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* 标签页头部 */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* 标签页内容 */}
          <div className="p-6">
            {/* 当前标签页描述 */}
            <div className="mb-6">
              <p className="text-gray-600">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>

            {/* 标签页内容区域 */}
            <div className="min-h-[600px]">
              {activeTab === 'variables' && (
                <VariableConfigManager />
              )}
              
              {activeTab === 'rules' && (
                <ModelGenerationRuleManager />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
