'use client'

import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { ColumnConfig } from '@/types/product'
import { Loader2, Plus, Edit, Settings, X, Trash2 } from 'lucide-react'

export function ColumnManagement() {
  const [columns, setColumns] = useState<ColumnConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isInitializing, setIsInitializing] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null)
  const [newColumn, setNewColumn] = useState({
    key: '',
    label: '',
    type: 'text',
    roles: ['user', 'dealer', 'admin'],
    width: '',
    order: 999,
    isVisible: true
  })
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchColumns()
  }, [])

  const fetchColumns = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/columns', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取列配置失败')
      }

      const data = await response.json()
      setColumns(data.columns || [])
    } catch (error: any) {
      setError(error.message || '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const initializeDefaultColumns = async () => {
    try {
      setIsInitializing(true)
      const response = await fetch('/api/admin/columns/init', {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '初始化失败')
      }

      await fetchColumns()
    } catch (error: any) {
      alert(error.message || '初始化失败')
    } finally {
      setIsInitializing(false)
    }
  }

  const updateColumn = async (columnId: string, updates: Partial<ColumnConfig>) => {
    try {
      const response = await fetch('/api/admin/columns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: columnId, ...updates }),
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新失败')
      }

      // 更新本地状态
      setColumns(prev => prev.map(col =>
        (col._id === columnId || col.id === columnId)
          ? { ...col, ...updates }
          : col
      ))

    } catch (error: any) {
      alert(error.message || '更新列配置失败')
    }
  }

  const addColumn = async () => {
    if (!newColumn.key || !newColumn.label) {
      alert('字段名和显示标签不能为空')
      return
    }

    try {
      setIsAdding(true)
      console.log('开始添加列配置:', newColumn)

      const response = await fetch('/api/admin/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newColumn),
        credentials: 'include'
      })

      console.log('API响应状态:', response.status)
      console.log('API响应头:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorMessage = '添加失败'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
          console.error('API错误响应:', error)
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('添加列配置成功:', result)

      // 重新获取列配置
      await fetchColumns()

      // 重置表单
      setNewColumn({
        key: '',
        label: '',
        type: 'text',
        roles: ['user', 'dealer', 'admin'],
        width: '',
        order: 999,
        isVisible: true
      })
      setShowAddForm(false)

      alert('列配置添加成功！')

    } catch (error: any) {
      console.error('添加列配置失败:', error)

      // 更详细的错误信息
      let errorMessage = '添加列配置失败'
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查服务器是否正常运行'
      } else if (error.message) {
        errorMessage = error.message
      }

      alert(errorMessage)
    } finally {
      setIsAdding(false)
    }
  }

  const deleteColumn = async (columnId: string, columnKey: string) => {
    if (!confirm(`确定要删除列 "${columnKey}" 吗？此操作不可撤销。`)) {
      return
    }

    try {
      setIsDeleting(columnId)
      const response = await fetch(`/api/admin/columns?id=${columnId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '删除失败')
      }

      // 从本地状态中移除
      setColumns(prev => prev.filter(col =>
        (col._id !== columnId && col.id !== columnId)
      ))

      alert('列配置删除成功！')

    } catch (error: any) {
      alert(error.message || '删除列配置失败')
    } finally {
      setIsDeleting(null)
    }
  }

  const editColumn = (column: ColumnConfig) => {
    setEditingColumn(column)
    setShowEditForm(true)
  }

  const saveEditedColumn = async () => {
    if (!editingColumn || !editingColumn.key || !editingColumn.label) {
      alert('字段名和显示标签不能为空')
      return
    }

    try {
      setIsAdding(true) // 复用loading状态
      const columnId = editingColumn._id || editingColumn.id!

      const response = await fetch('/api/admin/columns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: columnId,
          key: editingColumn.key,
          label: editingColumn.label,
          type: editingColumn.type,
          roles: editingColumn.roles,
          width: editingColumn.width,
          order: editingColumn.order,
          isVisible: editingColumn.isVisible
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新失败')
      }

      // 重新获取列配置
      await fetchColumns()
      setShowEditForm(false)
      setEditingColumn(null)

      alert('列配置更新成功！')

    } catch (error: any) {
      alert(error.message || '更新列配置失败')
    } finally {
      setIsAdding(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      text: '文本',
      image: '图片',
      number: '数字',
      date: '日期'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getRoleLabels = (roles: string[]) => {
    const labels = {
      user: '用户',
      dealer: '经销商',
      admin: '管理员'
    }
    return roles.map(role => labels[role as keyof typeof labels] || role).join(', ')
  }

  // 计算总列宽（只计算管理员和经销商可见的显示列）
  const calculateTotalWidth = () => {
    const visibleColumns = columns.filter(col => {
      // 只计算显示状态的列
      if (!col.isVisible) return false

      // 只计算管理员和经销商可见的列
      const hasAdminOrDealer = col.roles.includes('admin') || col.roles.includes('dealer')
      return hasAdminOrDealer
    })

    let totalWidth = 0
    let autoColumns = 0

    visibleColumns.forEach(col => {
      if (col.width && col.width.includes('%')) {
        const width = parseInt(col.width.replace('%', ''))
        if (!isNaN(width)) {
          totalWidth += width
        }
      } else {
        autoColumns++
      }
    })

    return {
      totalWidth,
      autoColumns,
      visibleColumnsCount: visibleColumns.length
    }
  }

  const widthStats = calculateTotalWidth()

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
        <Button onClick={fetchColumns} className="mt-4">
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">列配置管理</h3>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchColumns} variant="outline" size="sm">
            刷新
          </Button>
          {columns.length > 0 && (
            <Button
              onClick={() => setShowAddForm(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加新列
            </Button>
          )}
          {columns.length === 0 && (
            <Button
              onClick={initializeDefaultColumns}
              disabled={isInitializing}
              size="sm"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  初始化中...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  初始化默认配置
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {columns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无列配置</h3>
          <p className="text-gray-600 mb-4">
            请先初始化默认列配置，或手动添加列配置
          </p>
          <Button 
            onClick={initializeDefaultColumns}
            disabled={isInitializing}
          >
            {isInitializing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                初始化中...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                初始化默认配置
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>字段名</TableHead>
                  <TableHead>显示标签</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>可见角色</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>宽度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((column) => {
                  const columnId = column._id || column.id!
                  
                  return (
                    <TableRow key={columnId}>
                      <TableCell className="font-mono text-sm">{column.key}</TableCell>
                      <TableCell className="font-medium">{column.label}</TableCell>
                      <TableCell>{getTypeLabel(column.type)}</TableCell>
                      <TableCell>{getRoleLabels(column.roles)}</TableCell>
                      <TableCell>
                        <input
                          type="number"
                          value={column.order}
                          onChange={(e) => updateColumn(columnId, { order: Number(e.target.value) })}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={column.width ? column.width.replace('%', '') : ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '') {
                                updateColumn(columnId, { width: '' })
                              } else {
                                const numValue = parseInt(value)
                                if (numValue >= 1 && numValue <= 99) {
                                  updateColumn(columnId, { width: `${numValue}%` })
                                }
                              }
                            }}
                            placeholder="auto"
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="ml-1 text-sm text-gray-500">%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={column.isVisible}
                            onChange={(e) => updateColumn(columnId, { isVisible: e.target.checked })}
                            className="mr-2"
                          />
                          <span className={`text-sm ${column.isVisible ? 'text-green-600' : 'text-gray-400'}`}>
                            {column.isVisible ? '显示' : '隐藏'}
                          </span>
                        </label>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <select
                            value={column.roles.join(',')}
                            onChange={(e) => {
                              const roles = e.target.value.split(',').filter(Boolean)
                              updateColumn(columnId, { roles })
                            }}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="user,dealer,admin">所有用户</option>
                            <option value="dealer,admin">经销商+管理员</option>
                            <option value="admin">仅管理员</option>
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editColumn(column)}
                            className="p-1"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteColumn(columnId, column.key)}
                            disabled={isDeleting === columnId}
                            className="p-1 text-red-600 hover:text-red-700"
                          >
                            {isDeleting === columnId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* 列宽统计信息 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-900">列宽统计（管理员/经销商视图）</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">显示列数：</span>
                <span className="font-medium">{widthStats.visibleColumnsCount}</span>
              </div>
              <div>
                <span className="text-gray-600">固定宽度列：</span>
                <span className="font-medium">{widthStats.visibleColumnsCount - widthStats.autoColumns}</span>
              </div>
              <div>
                <span className="text-gray-600">自动宽度列：</span>
                <span className="font-medium">{widthStats.autoColumns}</span>
              </div>
              <div>
                <span className="text-gray-600">总列宽：</span>
                <span className={`font-medium ${
                  widthStats.totalWidth > 100 ? 'text-red-600' :
                  widthStats.totalWidth > 90 ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {widthStats.totalWidth}%
                </span>
                {widthStats.totalWidth > 100 && (
                  <span className="ml-2 text-xs text-red-600">⚠️ 超出100%</span>
                )}
                {widthStats.totalWidth > 90 && widthStats.totalWidth <= 100 && (
                  <span className="ml-2 text-xs text-orange-600">⚠️ 接近100%</span>
                )}
              </div>
            </div>

            {/* 详细说明 */}
            <div className="text-xs text-gray-500 mt-3 space-y-1">
              <p>• 只统计管理员和经销商可见的显示状态列</p>
              <p>• 自动宽度列将平均分配剩余空间：{Math.max(0, 100 - widthStats.totalWidth)}%</p>
              {widthStats.autoColumns > 0 && (
                <p>• 每个自动列约占：{widthStats.autoColumns > 0 ? Math.round(Math.max(0, 100 - widthStats.totalWidth) / widthStats.autoColumns * 10) / 10 : 0}%</p>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            共 {columns.length} 个列配置
          </div>
        </>
      )}

      {/* 添加新列表单 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">添加新列</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  字段名 *
                </label>
                <input
                  type="text"
                  value={newColumn.key}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="例如: productName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  显示标签 *
                </label>
                <input
                  type="text"
                  value={newColumn.label}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="例如: 产品名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类型
                </label>
                <select
                  value={newColumn.type}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">文本</option>
                  <option value="image">图片</option>
                  <option value="number">数字</option>
                  <option value="date">日期</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  可见角色
                </label>
                <select
                  value={newColumn.roles.join(',')}
                  onChange={(e) => {
                    const roles = e.target.value.split(',').filter(Boolean)
                    setNewColumn(prev => ({ ...prev, roles }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user,dealer,admin">所有用户</option>
                  <option value="dealer,admin">经销商+管理员</option>
                  <option value="admin">仅管理员</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排序
                  </label>
                  <input
                    type="number"
                    value={newColumn.order}
                    onChange={(e) => setNewColumn(prev => ({ ...prev, order: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    宽度 (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={newColumn.width ? newColumn.width.replace('%', '') : ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setNewColumn(prev => ({
                        ...prev,
                        width: value ? `${value}%` : ''
                      }))
                    }}
                    placeholder="auto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newColumn.isVisible}
                    onChange={(e) => setNewColumn(prev => ({ ...prev, isVisible: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">默认显示</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={isAdding}
              >
                取消
              </Button>
              <Button
                onClick={addColumn}
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    添加中...
                  </>
                ) : (
                  '添加'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑列表单 */}
      {showEditForm && editingColumn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">编辑列配置</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEditForm(false)
                  setEditingColumn(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  字段名 *
                </label>
                <input
                  type="text"
                  value={editingColumn.key}
                  onChange={(e) => setEditingColumn(prev => prev ? { ...prev, key: e.target.value } : null)}
                  placeholder="例如: productName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled // 字段名不允许修改
                />
                <p className="text-xs text-gray-500 mt-1">字段名不可修改</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  显示标签 *
                </label>
                <input
                  type="text"
                  value={editingColumn.label}
                  onChange={(e) => setEditingColumn(prev => prev ? { ...prev, label: e.target.value } : null)}
                  placeholder="例如: 产品名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类型
                </label>
                <select
                  value={editingColumn.type}
                  onChange={(e) => setEditingColumn(prev => prev ? { ...prev, type: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">文本</option>
                  <option value="image">图片</option>
                  <option value="number">数字</option>
                  <option value="date">日期</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  可见角色
                </label>
                <select
                  value={editingColumn.roles.join(',')}
                  onChange={(e) => {
                    const roles = e.target.value.split(',').filter(Boolean)
                    setEditingColumn(prev => prev ? { ...prev, roles } : null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user,dealer,admin">所有用户</option>
                  <option value="dealer,admin">经销商+管理员</option>
                  <option value="admin">仅管理员</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排序
                  </label>
                  <input
                    type="number"
                    value={editingColumn.order}
                    onChange={(e) => setEditingColumn(prev => prev ? { ...prev, order: Number(e.target.value) } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    宽度 (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={editingColumn.width ? editingColumn.width.replace('%', '') : ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setEditingColumn(prev => prev ? {
                        ...prev,
                        width: value ? `${value}%` : ''
                      } : null)
                    }}
                    placeholder="auto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingColumn.isVisible}
                    onChange={(e) => setEditingColumn(prev => prev ? { ...prev, isVisible: e.target.checked } : null)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">默认显示</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditForm(false)
                  setEditingColumn(null)
                }}
                disabled={isAdding}
              >
                取消
              </Button>
              <Button
                onClick={saveEditedColumn}
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
