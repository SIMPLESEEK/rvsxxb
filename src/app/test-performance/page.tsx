'use client'

import React, { useState, useEffect } from 'react'
import { ImageThumbnail } from '@/components/ui/ImageThumbnail'
import { imageCache } from '@/lib/imageCache'

export default function TestPerformancePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loadTime, setLoadTime] = useState<number>(0)
  const [cacheStats, setCacheStats] = useState<any>({})

  useEffect(() => {
    fetchProducts()
    
    // 定期更新缓存统计
    const interval = setInterval(() => {
      setCacheStats(imageCache.getCacheStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchProducts = async () => {
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/products', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取产品数据失败')
      }

      const data = await response.json()
      setProducts(data.products || [])
      setLoadTime(Date.now() - startTime)
    } catch (error) {
      console.error('加载失败:', error)
    }
  }

  const clearCache = () => {
    imageCache.clearCache()
    setCacheStats(imageCache.getCacheStats())
  }

  const refreshPage = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">图片加载性能测试</h1>
          
          {/* 性能统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-700 mb-2">数据加载时间</h3>
              <p className="text-2xl font-bold text-blue-600">{loadTime}ms</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-700 mb-2">产品数量</h3>
              <p className="text-2xl font-bold text-green-600">{products.length}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-700 mb-2">图片缓存</h3>
              <div className="text-sm">
                <p>总计: {cacheStats.total || 0}</p>
                <p>已加载: {cacheStats.loaded || 0}</p>
                <p>加载中: {cacheStats.loading || 0}</p>
                <p>错误: {cacheStats.error || 0}</p>
                <p>过期: {cacheStats.expired || 0}</p>
              </div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={refreshPage}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              刷新页面
            </button>
            <button
              onClick={clearCache}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              清空缓存
            </button>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              重新加载数据
            </button>
          </div>
        </div>

        {/* 测试区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 懒加载模式 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              懒加载模式 (Dashboard 风格)
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {products.map((product, index) => (
                <div key={`lazy-${index}`} className="flex items-center gap-4 p-3 border rounded">
                  <ImageThumbnail
                    src={product.images?.display || ''}
                    alt={product.name}
                    thumbnailClassName="w-16 h-16"
                    lazy={true}
                  />
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.brand}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 立即加载模式 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              立即加载模式 (Products-V2 风格)
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {products.map((product, index) => (
                <div key={`immediate-${index}`} className="flex items-center gap-4 p-3 border rounded">
                  <ImageThumbnail
                    src={product.images?.display || ''}
                    alt={product.name}
                    thumbnailClassName="w-16 h-16"
                    lazy={false}
                  />
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.brand}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">优化说明</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• <strong>懒加载模式</strong>：图片只在进入视口时才开始加载，适合长列表</li>
            <li>• <strong>立即加载模式</strong>：图片立即开始加载，适合少量图片的场景</li>
            <li>• <strong>图片缓存</strong>：已加载的图片会被缓存，再次访问时立即显示</li>
            <li>• <strong>错误处理</strong>：加载失败的图片会显示错误状态，避免无限重试</li>
            <li>• <strong>性能监控</strong>：实时显示缓存状态和加载统计</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
