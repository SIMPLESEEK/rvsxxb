'use client'

import { useState } from 'react'

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleMigrate = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/migrate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: '请求失败',
        details: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestLegacyData = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/legacy-products')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: '请求失败',
        details: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">数据迁移工具</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={handleTestLegacyData}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? '加载中...' : '测试Legacy数据'}
        </button>
        
        <button
          onClick={handleMigrate}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ml-4"
        >
          {isLoading ? '迁移中...' : '开始数据迁移'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">结果:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
