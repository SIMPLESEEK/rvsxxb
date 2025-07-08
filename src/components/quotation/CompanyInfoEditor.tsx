'use client'

import React, { useState, useEffect, useRef } from 'react'
import { QuotationTemplate } from '@/types/quotation'
import { Button } from '@/components/ui/Button'
import { Save, Edit, X, Upload, Image } from 'lucide-react'

interface CompanyInfoEditorProps {
  onSave?: () => void
}

export function CompanyInfoEditor({ onSave }: CompanyInfoEditorProps) {
  const [template, setTemplate] = useState<QuotationTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: ''
  })
  const [quotationNotes, setQuotationNotes] = useState('')

  useEffect(() => {
    fetchTemplate()
  }, [])

  const fetchTemplate = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/quotation-templates', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取模板失败')
      }

      const data = await response.json()
      setTemplate(data.template)
      setFormData(data.template.companyInfo)
      setQuotationNotes(data.template.quotationNotes || '1.报价为人民币（RMB）价格，报价含税，报价有效期6个月；\n2.报价为工厂交易价，不含运费；\n3.产品质保期2年，如非正常使用损坏，费用自理，厂家提供协助维护；')
    } catch (error: any) {
      console.error('获取模板失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/quotation-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyInfo: formData,
          quotationNotes: quotationNotes
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      await fetchTemplate()
      setIsEditing(false)
      onSave?.()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (template) {
      setFormData(template.companyInfo as any)
      setQuotationNotes(template.quotationNotes || '1.报价为人民币（RMB）价格，报价含税，报价有效期6个月；\n2.报价为工厂交易价，不含运费；\n3.产品质保期2年，如非正常使用损坏，费用自理，厂家提供协助维护；')
    }
    setIsEditing(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true)

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'xxb')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const data = await response.json()
      handleInputChange('logo', data.url)
    } catch (error: any) {
      console.error('LOGO上传失败:', error)
      alert('LOGO上传失败，请重试')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }

      // 验证文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过10MB')
        return
      }

      handleLogoUpload(file)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">报价模板设置</h3>
        {!isEditing ? (
          <Button
            size="sm"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center"
          >
            <Edit className="w-4 h-4 mr-1" />
            编辑
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? '保存中...' : '保存'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              取消
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            报价公司 *
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入报价公司名称"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
              {formData.name || '未设置'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            报价品牌
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.brandName || ''}
              onChange={(e) => handleInputChange('brandName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入报价品牌名称"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
              {formData.brandName || '未设置'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            联系人
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.contactPerson || ''}
              onChange={(e) => handleInputChange('contactPerson', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入联系人姓名"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
              {formData.contactPerson || '未设置'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            联系电话
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入联系电话"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
              {formData.phone || '未设置'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            邮箱地址
          </label>
          {isEditing ? (
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入邮箱地址"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
              {formData.email || '未设置'}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            公司地址
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入公司地址"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
              {formData.address || '未设置'}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            公司LOGO
          </label>
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="url"
                  value={formData.logo || ''}
                  onChange={(e) => handleInputChange('logo', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入LOGO图片URL或点击上传"
                  disabled={isUploadingLogo}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                  aria-label="选择LOGO图片文件"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="flex items-center"
                >
                  {isUploadingLogo ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-1"></div>
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-1" />
                      上传LOGO
                    </>
                  )}
                </Button>
              </div>
              {formData.logo && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">预览：</span>
                  <img
                    src={formData.logo}
                    alt="公司LOGO"
                    className="h-12 object-contain border rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">
                支持JPG、PNG格式，建议尺寸不超过200x100px，文件大小不超过10MB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
                {formData.logo || '未设置'}
              </div>
              {formData.logo && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">预览：</span>
                  <img
                    src={formData.logo}
                    alt="公司LOGO"
                    className="h-12 object-contain border rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 报价说明模板 */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            报价说明模板
          </label>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={quotationNotes}
                onChange={(e) => setQuotationNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
                placeholder="请输入默认的报价说明内容"
              />
              <p className="text-xs text-gray-500">
                此模板将作为新建报价单时的默认报价说明
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="px-3 py-2 bg-gray-50 rounded-md text-sm whitespace-pre-line">
                {quotationNotes || '未设置'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
