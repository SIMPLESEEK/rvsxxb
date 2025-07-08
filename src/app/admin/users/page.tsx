'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserManagement } from '@/components/admin/UserManagement'
import { useAuth } from '@/providers/AuthProvider'
import { Loader2 } from 'lucide-react'

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/product-list-v3')
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
      <UserManagement />
    </div>
  )
}
