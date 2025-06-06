'use client'

import React, { useState, useEffect } from 'react'
import { ImageThumbnailSimple } from '@/components/ui/ImageThumbnailSimple'

export default function TestImageSimplePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/debug-products', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取产品数据失败')
      }

      const data = await response.json()
      console.log('Debug products data:', data)
      setProducts(data.debugInfo || [])
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">图片加载测试</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-4">{product.name}</h3>
              
              {/* 产品图片 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">产品图片</h4>
                <div className="border rounded p-2">
                  <ImageThumbnailSimple
                    src={product.images?.display || ''}
                    alt={`${product.name} - 产品图片`}
                    thumbnailClassName="w-24 h-24"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 break-all">
                  {product.images?.display || '(无图片)'}
                </p>
              </div>

              {/* 尺寸图 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">尺寸图</h4>
                <div className="border rounded p-2">
                  <ImageThumbnailSimple
                    src={product.images?.dimension || ''}
                    alt={`${product.name} - 尺寸图`}
                    thumbnailClassName="w-24 h-24"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 break-all">
                  {product.images?.dimension || '(无图片)'}
                </p>
              </div>

              {/* 配件图 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">配件图</h4>
                <div className="border rounded p-2">
                  <ImageThumbnailSimple
                    src={product.images?.accessories || ''}
                    alt={`${product.name} - 配件图`}
                    thumbnailClassName="w-24 h-24"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 break-all">
                  {product.images?.accessories || '(无图片)'}
                </p>
              </div>

              {/* 原始img标签测试 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">原始img标签</h4>
                <div className="border rounded p-2">
                  {product.images?.display ? (
                    <img
                      src={product.images.display}
                      alt={`${product.name} - 原始`}
                      className="w-24 h-24 object-cover border rounded"
                      onLoad={() => console.log('原始img加载成功:', product.images.display)}
                      onError={() => console.log('原始img加载失败:', product.images.display)}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 border rounded flex items-center justify-center text-gray-400 text-xs">
                      无图片
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">没有找到产品数据</p>
          </div>
        )}
      </div>
    </div>
  )
}
