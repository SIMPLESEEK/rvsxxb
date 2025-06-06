'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, Users, Upload, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { User } from '@/types/auth'
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal'

interface NavbarProps {
  user: User | null
  onLogout: () => void
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const router = useRouter()
  const [showChangePassword, setShowChangePassword] = useState(false)

  const handleLogout = async () => {
    await onLogout()
    router.push('/login')
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      dealer: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800'
    }
    
    const labels = {
      admin: '管理员',
      dealer: '经销商',
      user: '用户'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[role as keyof typeof badges]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                RVS Lighting 选型表
              </h1>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    欢迎，{user.username}
                  </span>
                  {getRoleBadge(user.role)}
                </div>

                {user.role === 'admin' && (
                  <div className="hidden md:flex items-center space-x-2">
                    <Link href="/admin/users">
                      <Button variant="ghost" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="hidden lg:inline">用户管理</span>
                        <span className="lg:hidden">用户</span>
                      </Button>
                    </Link>
                    <Link href="/admin/products-v2" target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        <span className="hidden lg:inline">产品管理</span>
                        <span className="lg:hidden">产品</span>
                      </Button>
                    </Link>
                    <Link href="/admin/columns">
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        <span className="hidden lg:inline">列设置</span>
                        <span className="lg:hidden">设置</span>
                      </Button>
                    </Link>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChangePassword(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">修改密码</span>
                  <span className="lg:hidden">密码</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  退出
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 密码修改弹窗 */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </nav>
  )
}
