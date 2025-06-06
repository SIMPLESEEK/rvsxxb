'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { EnhancedProductManagement } from '@/components/admin/EnhancedProductManagement'
import { useAuth } from '@/providers/AuthProvider'
import { Loader2 } from 'lucide-react'

export default function AdminProductsPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">产品管理</h2>
          <p className="mt-1 text-sm text-gray-600">
            管理产品信息、价格和库存状态 (参考xxbws设计的增强版)
          </p>
        </div>

        {/* 使用增强版产品管理组件 */}
        <EnhancedProductManagement userRole={user.role} />

        {/* 原版产品管理组件（备用） */}
        {/* <ProductManagement /> */}
      </main>
    </div>
  )
}
