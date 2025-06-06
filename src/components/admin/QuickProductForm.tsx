'use client'

import React, { useState } from 'react'
import { Save, X, Upload, Move } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface QuickProductFormProps {
  product?: any
  onSave: (product: any) => void
  onCancel: () => void
}

export function QuickProductForm({ product, onSave, onCancel }: QuickProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    model: product?.model || '',
    productType: product?.productType || '筒灯',
    brand: product?.brand || 'RVS',
    order: product?.order || 1,
    // 规格信息
    specifications: {
      detailed: product?.specifications?.detailed || '',
      brief: product?.specifications?.brief || ''
    },
    // 外观信息
    appearance: {
      color: product?.appearance?.color || '白色',
      installation: product?.appearance?.installation || '嵌入式',
      cutoutSize: product?.appearance?.cutoutSize || '100mm'
    },
    control: product?.control || '开关控制',
    notes: product?.notes || '',
    // 价格和交期
    pricing: {
      unitPrice: product?.pricing?.unitPrice || 0,
      deliveryTime: product?.pricing?.deliveryTime || '3-5个工作日'
    },
    // 图片
    images: {
      display: product?.images?.display || '',
      dimension: product?.images?.dimension || '',
      accessories: product?.images?.accessories || ''
    },
    // 状态
    isActive: product?.isActive !== false,
    isFeatured: product?.isFeatured || false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev] as any,
        [field]: value
      }
    }))
  }

  const handleImageChange = (type: 'display' | 'dimension' | 'accessories', value: string) => {
    setFormData(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: value
      }
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? '编辑产品' : '添加产品'}
          </h2>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                产品名称 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: 筒灯"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                产品型号 *
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: TEST-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                产品类型
              </label>
              <select
                value={formData.productType}
                onChange={(e) => handleInputChange('productType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="筒灯">筒灯</option>
                <option value="射灯">射灯</option>
                <option value="面板灯">面板灯</option>
                <option value="轨道灯">轨道灯</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                显示顺序
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) => handleInputChange('order', parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="排序数字"
                />
                <Button type="button" variant="outline" size="sm">
                  <Move className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 规格信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">产品规格</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  详细规格参数
                </label>
                <textarea
                  value={formData.specifications.detailed}
                  onChange={(e) => handleNestedChange('specifications', 'detailed', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: 7788油过载保护详细信息"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  简要规格参数
                </label>
                <textarea
                  value={formData.specifications.brief}
                  onChange={(e) => handleNestedChange('specifications', 'brief', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: 满足777规格要求信息"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">外观颜色</label>
                <select
                  value={formData.appearance.color}
                  onChange={(e) => handleNestedChange('appearance', 'color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="选择外观颜色"
                >
                  <option value="白色">白色</option>
                  <option value="黑色">黑色</option>
                  <option value="银色">银色</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">安装方式</label>
                <select
                  value={formData.appearance.installation}
                  onChange={(e) => handleNestedChange('appearance', 'installation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="选择安装方式"
                >
                  <option value="嵌入式">嵌入式</option>
                  <option value="吸顶式">吸顶式</option>
                  <option value="悬挂式">悬挂式</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开孔尺寸</label>
                <input
                  type="text"
                  value={formData.appearance.cutoutSize}
                  onChange={(e) => handleNestedChange('appearance', 'cutoutSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: 100mm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">控制方式</label>
                <select
                  value={formData.control}
                  onChange={(e) => handleInputChange('control', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="选择控制方式"
                >
                  <option value="开关控制">开关控制</option>
                  <option value="调光控制">调光控制</option>
                  <option value="智能控制">智能控制</option>
                </select>
              </div>
            </div>
          </div>

          {/* 价格信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                单价
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.pricing.unitPrice}
                onChange={(e) => handleNestedChange('pricing', 'unitPrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: 99.99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                交期时间
              </label>
              <input
                type="text"
                value={formData.pricing.deliveryTime}
                onChange={(e) => handleNestedChange('pricing', 'deliveryTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: 3-5个工作日"
              />
            </div>
          </div>

          {/* 状态设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                启用产品
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
                推荐产品
              </label>
            </div>
          </div>

          {/* 图片上传 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">产品图片</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['display', 'dimension', 'accessories'].map((type) => (
                <div key={type}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {type === 'display' ? '产品图片' : type === 'dimension' ? '尺寸图' : '配件图'}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {formData.images[type as keyof typeof formData.images] ? (
                      <div className="space-y-2">
                        <img 
                          src={formData.images[type as keyof typeof formData.images]} 
                          alt={type}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleImageChange(type as any, '')}
                        >
                          删除
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">点击上传图片</p>
                        <input
                          type="url"
                          placeholder="或输入图片URL"
                          onChange={(e) => handleImageChange(type as any, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="其他说明信息..."
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              保存产品
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
