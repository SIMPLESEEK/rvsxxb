'use client'

import React, { useState } from 'react'

export default function TestLongTextPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const createTestProduct = async () => {
    setIsLoading(true)
    try {
      const testProduct = {
        productType: '测试产品类型名称比较长',
        brand: 'RVS测试品牌',
        name: '测试产品名称包含很多文字内容用于验证显示效果',
        model: 'TEST-MODEL-001-LONG-NAME',
        images: {
          display: '/sample-images/test.jpg',
          dimension: '/sample-images/test-dim.jpg',
          accessories: '/sample-images/test-acc.jpg'
        },
        specifications: {
          detailed: `这是一个详细规格参数的测试内容
功率: 50W 高功率LED芯片
光效率: 120° 宽角度照明
色温: 3000K/4000K/5000K 可选
显色指数: >90 高显色指数
输入电压: AC220V 50/60Hz
防护等级: IP65 户外防水
调光方式: 0-10V调光/DALI调光
材质: 压铸铝合金外壳，表面阳极氧化处理
散热: 高效散热片设计，确保LED长寿命
透镜: 进口PMMA透镜，透光率>92%
安装: 支架可360°调节角度
适用场所: 户外建筑照明、广场照明、景观照明、体育场馆照明
认证: CE、RoHS、FCC认证
质保: 5年质保期`,
          brief: '50W高功率LED投光灯，IP65防水，支持多种调光方式，适用于各种户外照明场景'
        },
        appearance: {
          color: '深灰色阳极氧化铝合金外壳',
          installation: '支架安装，角度可调',
          cutoutSize: '不适用于嵌入安装'
        },
        control: '0-10V调光/DALI调光/开关控制',
        notes: '这是一个测试备注信息，包含较长的文字内容用于验证表格中文字的显示效果，确保所有文字都能正确显示而不被截断',
        pricing: {
          unitPrice: 299.99,
          deliveryTime: '7-10个工作日'
        }
      }

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(testProduct)
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: '创建失败', details: error })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">创建长文字测试产品</h1>
      
      <button
        onClick={createTestProduct}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {isLoading ? '创建中...' : '创建长文字测试产品'}
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
