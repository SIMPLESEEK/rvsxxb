'use client'

import { useState } from 'react'

export default function SetupPage() {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const createTestUsers = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/create-test-user', {
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

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">系统设置</h1>
      
      <div className="space-y-4 mb-8">
        <div>
          <button
            onClick={createTestUsers}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoading ? '创建中...' : '创建测试用户'}
          </button>
          <p className="text-sm text-gray-600 mt-1">创建admin、dealer、user三个测试账号</p>
        </div>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">结果:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.success && result.loginInfo && (
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <h3 className="font-bold text-blue-800 mb-2">测试账号信息：</h3>
              {result.loginInfo.map((user: any, index: number) => (
                <div key={index} className="mb-2">
                  <strong>{user.role}:</strong> 用户名: {user.username}, 密码: {user.password}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
