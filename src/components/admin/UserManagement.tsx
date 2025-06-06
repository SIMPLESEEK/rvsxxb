'use client'

import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { User, UserRole } from '@/types/auth'
import { formatDate } from '@/lib/utils'
import { Loader2, Save, Shield, Mail } from 'lucide-react'
import { ResetPasswordModal } from './ResetPasswordModal'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set())
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取用户列表失败')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error: any) {
      setError(error.message || '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUsers(prev => new Set(prev).add(userId))
      
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新失败')
      }

      // 更新本地状态
      setUsers(prev => prev.map(user => 
        user._id === userId || user.id === userId 
          ? { ...user, role: newRole }
          : user
      ))

    } catch (error: any) {
      alert(error.message || '更新用户角色失败')
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const styles = {
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
        {labels[role]}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchUsers} className="mt-4">
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">用户管理</h3>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          刷新
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>当前角色</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const userId = user._id || user.id!
              const isUpdating = updatingUsers.has(userId)
              
              return (
                <TableRow key={userId}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(userId, e.target.value as UserRole)}
                        disabled={isUpdating}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="选择用户角色"
                      >
                        <option value="user">用户</option>
                        <option value="dealer">经销商</option>
                        <option value="admin">管理员</option>
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setResetPasswordUser(user)}
                        disabled={isUpdating}
                        className="text-xs"
                        title="重置用户密码"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        重置密码
                      </Button>
                      {isUpdating && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-600">
        共 {users.length} 个用户
      </div>

      {/* 联系方式 */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center text-sm text-gray-500">
          <Mail className="h-4 w-4 mr-2" />
          如有疑问请联系
          <a
            href="mailto:Eva@rvs-lighting.com"
            className="ml-1 text-blue-600 hover:text-blue-800 underline"
          >
            Eva@rvs-lighting.com
          </a>
        </div>
      </div>

      {/* 重置密码弹窗 */}
      <ResetPasswordModal
        isOpen={!!resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        user={resetPasswordUser}
        onSuccess={fetchUsers}
      />
    </div>
  )
}
