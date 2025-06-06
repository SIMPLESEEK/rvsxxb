'use client'

import { useState } from 'react'

export default function TestMigrationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testLegacyData = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/legacy-products')
      const data = await response.json()
      setResult({
        type: 'legacy-test',
        ...data
      })
    } catch (error) {
      setResult({
        type: 'legacy-test',
        success: false,
        error: '请求失败',
        details: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const runMigration = async () => {
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
      setResult({
        type: 'migration',
        ...data
      })
    } catch (error) {
      setResult({
        type: 'migration',
        success: false,
        error: '请求失败',
        details: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testNewProducts = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/external/products')
      const data = await response.json()
      setResult({
        type: 'new-products-test',
        ...data
      })
    } catch (error) {
      setResult({
        type: 'new-products-test',
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
      <h1 className="text-3xl font-bold mb-8">数据迁移测试</h1>
      
      <div className="space-y-4 mb-8">
        <div>
          <button
            onClick={testLegacyData}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoading ? '加载中...' : '1. 测试Legacy数据'}
          </button>
          <p className="text-sm text-gray-600 mt-1">测试从xxbws数据库读取原始数据</p>
        </div>
        
        <div>
          <button
            onClick={runMigration}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoading ? '迁移中...' : '2. 执行数据迁移'}
          </button>
          <p className="text-sm text-gray-600 mt-1">将xxbws数据转换为xxbaug格式</p>
        </div>
        
        <div>
          <button
            onClick={testNewProducts}
            disabled={isLoading}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoading ? '加载中...' : '3. 测试新产品API'}
          </button>
          <p className="text-sm text-gray-600 mt-1">测试迁移后的产品数据是否可以正常访问</p>
        </div>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">
            结果 ({result.type}):
          </h2>
          <div className="max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
