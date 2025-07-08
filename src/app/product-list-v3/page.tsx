'use client'

import React, { useState, useEffect } from 'react'
import { ProductSelectionTableV3 } from '@/components/dashboard/ProductSelectionTableV3'
import { Button } from '@/components/ui/Button'
import { ShoppingCart, List, Maximize2, Minimize2, Plus, Users, Key, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal'
import { applyQuarkHeaderFix } from '@/utils/quark-browser-fix'

export default function ProductListV3Page() {
  const [isFullWidth, setIsFullWidth] = useState(false) // 默认居中布局
  const [showChangePassword, setShowChangePassword] = useState(false)
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  // 检查用户认证状态
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // 夸克浏览器兼容性修复
  useEffect(() => {
    // 使用专门的修复工具
    const cleanup = applyQuarkHeaderFix()

    return cleanup
  }, [user])

  // 如果正在加载或用户未认证，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // 将重定向到登录页面
  }

  return (
    <div className="min-h-screen bg-gray-50" id="main-page-container">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b" id="main-header">
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${isFullWidth ? 'max-w-full' : 'max-w-7xl'}`}>
          <div className="py-3 sm:py-4 lg:py-3">
            {/* 页眉布局：移动端垂直，桌面端左右分布 */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4" id="header-layout">
              <div className="lg:flex-1">
                {/* 移动端：垂直布局 */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:hidden" id="mobile-header">
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2" id="mobile-title">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                    RVS Lighting 产品选型表
                  </h1>
                  {/* 当前登录用户显示 */}
                  <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded-lg border border-blue-200 self-start" id="mobile-user-info">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-700">
                      <span className="font-medium text-blue-700">{user.username}</span>
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : user.role === 'dealer'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {user.role === 'admin' ? '管理员' : user.role === 'dealer' ? '经销商' : '用户'}
                    </span>
                  </div>
                </div>

                {/* 桌面端：紧凑的左侧布局 */}
                <div className="hidden lg:block" id="desktop-header">
                  <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3" id="desktop-title">
                      <ShoppingCart className="h-8 w-8 text-blue-600" />
                      RVS Lighting 产品选型表
                    </h1>
                    {/* 当前登录用户显示 */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200" id="desktop-user-info">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        当前用户：<span className="font-medium text-blue-700">{user.username}</span>
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-700'
                          : user.role === 'dealer'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {user.role === 'admin' ? '管理员' : user.role === 'dealer' ? '经销商' : '用户'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    专业照明产品选型系统 - 选择变量参数，生成产品型号，添加到项目清单
                  </p>
                </div>
              </div>

              {/* 按钮组 - 桌面端紧凑布局 */}
              <div className="flex flex-col sm:flex-row lg:flex-row gap-2">
                {/* 第一行按钮 */}
                <div className="flex flex-wrap gap-2">
                  {/* 全宽/居中按钮 - 仅在桌面端显示 */}
                  <Button
                    variant="outline"
                    onClick={() => setIsFullWidth(!isFullWidth)}
                    className="mobile-hidden-layout-btn lg:flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-4 py-1.5 lg:py-2"
                    title={isFullWidth ? "切换到居中布局" : "切换到全宽布局"}
                  >
                    {isFullWidth ? <Minimize2 className="h-3 w-3 lg:h-4 lg:w-4" /> : <Maximize2 className="h-3 w-3 lg:h-4 lg:w-4" />}
                    <span className="lg:inline">{isFullWidth ? "居中布局" : "全宽布局"}</span>
                  </Button>

                  <Link href="/project-list">
                    <Button
                      variant="outline"
                      className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-4 py-1.5 lg:py-2"
                    >
                      <List className="h-3 w-3 lg:h-4 lg:w-4" />
                      <span className="hidden lg:inline">项目清单</span>
                      <span className="lg:hidden">清单</span>
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() => setShowChangePassword(true)}
                    className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-4 py-1.5 lg:py-2"
                  >
                    <Key className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="hidden lg:inline">修改密码</span>
                    <span className="lg:hidden">密码</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      logout()
                      router.push('/login')
                    }}
                    className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-4 py-1.5 lg:py-2"
                  >
                    <LogOut className="h-3 w-3 lg:h-4 lg:w-4" />
                    退出
                  </Button>
                </div>

                {/* 管理员专用按钮 - 桌面端同行显示 */}
                {user?.role === 'admin' && (
                  <div className="flex flex-wrap gap-2 mt-2 lg:mt-0">
                    <Link href="/admin/users">
                      <Button
                        variant="outline"
                        className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-4 py-1.5 lg:py-2"
                      >
                        <Users className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="hidden lg:inline">用户管理</span>
                        <span className="lg:hidden">用户</span>
                      </Button>
                    </Link>

                    {/* 产品管理按钮 - 仅在桌面端显示 */}
                    <Link href="/admin/products-v2" target="_blank" className="mobile-hidden-product-mgmt">
                      <Button
                        variant="outline"
                        className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-4 py-1.5 lg:py-2"
                        title="在新标签页中打开产品管理页面"
                      >
                        <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="lg:inline">产品管理</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 ${isFullWidth ? 'max-w-full' : 'max-w-7xl'}`}>
        <ProductSelectionTableV3 userRole={user.role} />
      </div>

      {/* 底部操作栏 - 移动端优化版本 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className={`mx-auto px-2 sm:px-6 lg:px-8 py-1.5 sm:py-3 ${isFullWidth ? 'max-w-full' : 'max-w-7xl'}`}>
          <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
            {/* 移动端压缩版本 - 2行显示 */}
            <div className="text-center sm:hidden">
              <div className="text-xs text-gray-600 leading-tight">
                完整的产品选型表 - 选择变量参数，添加到项目清单进行报价
              </div>
              <div className="text-[10px] text-gray-500 leading-tight">
                如有问题请使用Chrome或Edge浏览器
              </div>
            </div>

            {/* 桌面端版本 - 保持原样 */}
            <div className="hidden sm:flex sm:flex-col sm:items-center sm:justify-center sm:gap-1">
              <div className="text-sm text-gray-600 text-center">
                <span>完整的产品选型表 - 选择变量参数，添加到项目清单进行报价</span>
                <span className="ml-4 text-xs text-gray-500 hidden lg:inline">
                  当前布局：{isFullWidth ? '全宽布局' : '居中布局'}
                </span>
              </div>
              <div className="text-xs text-gray-500 text-center">
                如果页面显示有问题，请使用Chrome或者Edge浏览器使用本工具
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 为底部操作栏留出空间 - 移动端减小高度 */}
      <div className="h-12 sm:h-24"></div>

      {/* 修改密码弹窗 */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  )
}
