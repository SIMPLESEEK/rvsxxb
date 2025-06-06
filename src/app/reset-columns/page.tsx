'use client'

import React, { useState } from 'react'

export default function ResetColumnsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const resetColumns = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reset-columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: '重置失败', details: error })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">重置列配置</h1>
      
      <button
        onClick={resetColumns}
        disabled={isLoading}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      >
        {isLoading ? '重置中...' : '重置列配置'}
      </button>

      {result && (
        <div className="mt-6 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">结果:</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6">
        <a 
          href="/test-table" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          查看测试表格
        </a>
      </div>
    </div>
  )
}
