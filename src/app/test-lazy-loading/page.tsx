'use client'

import React, { useState, useEffect } from 'react'
import { ImageThumbnail } from '@/components/ui/ImageThumbnail'

export default function TestLazyLoadingPage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/products', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取产品数据失败')
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (error: any) {
      console.error('加载产品失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">懒加载测试页面</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">说明</h2>
          <p className="text-gray-600 mb-2">
            这个页面用于测试图片懒加载功能。请打开浏览器开发者工具的控制台查看日志。
          </p>
          <p className="text-gray-600">
            向下滚动时，图片应该在进入视口前50px时开始加载。
          </p>
        </div>

        {/* 创建一个很长的列表来测试懒加载 */}
        <div className="space-y-8">
          {products.map((product, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <ImageThumbnail
                    src={product.images?.display || ''}
                    alt={product.name}
                    thumbnailClassName="w-24 h-24"
                    lazy={true}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-2">品牌: {product.brand}</p>
                  <p className="text-gray-600 mb-2">型号: {product.model}</p>
                  <p className="text-sm text-gray-500">
                    图片URL: {product.images?.display || '(无图片)'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 添加一些占位内容来增加页面高度 */}
        <div className="mt-16 space-y-4">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="bg-gray-100 p-8 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">占位内容 {i + 1}</h3>
              <p className="text-gray-600">
                这是一些占位内容，用于增加页面高度，以便测试懒加载功能。
                当您向下滚动时，上面的图片应该在进入视口时才开始加载。
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
