'use client'

import { useState } from 'react'

export default function LoginTestPage() {
  const [formData, setFormData] = useState({
    username: 'liu',
    password: '20240723'
  })
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/auth/login-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      setResult({
        status: response.status,
        data
      })
    } catch (error) {
      setResult({
        status: 'error',
        data: {
          error: '网络错误',
          details: error instanceof Error ? error.message : '未知错误'
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const testUsers = [
    { username: 'rvsadmin', password: 'rvs2024', role: 'admin' },
    { username: 'julin', password: 'julin123', role: 'dealer' },
    { username: 'liu', password: '20240723', role: 'user' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录测试
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            测试用户登录功能
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-bold text-blue-800 mb-2">测试账号：</h3>
          {testUsers.map((user, index) => (
            <div key={index} className="mb-2 text-sm">
              <button
                onClick={() => setFormData({ username: user.username, password: user.password })}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {user.role}: {user.username} / {user.password}
              </button>
            </div>
          ))}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="请输入密码"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '测试中...' : '测试登录'}
            </button>
          </div>
        </form>

        {result && (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold mb-2">测试结果:</h3>
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
