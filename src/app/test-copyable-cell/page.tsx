'use client'

import React from 'react'
import { CopyableCell } from '@/components/ui/CopyableCell'

export default function TestCopyableCellPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">CopyableCell 组件测试</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">新版本 - 无图标版本</h2>
          <div className="space-y-4">
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">普通文本</h3>
              <CopyableCell value="筒灯" />
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">品牌名称</h3>
              <CopyableCell value="RVS" />
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">长文本</h3>
              <CopyableCell value="这是一个比较长的文本内容，用来测试复制功能" />
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">数字</h3>
              <CopyableCell value="99.99" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">表格中的效果测试</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 bg-gray-100">产品类型</th>
                <th className="border border-gray-300 p-2 bg-gray-100">品牌</th>
                <th className="border border-gray-300 p-2 bg-gray-100">型号</th>
                <th className="border border-gray-300 p-2 bg-gray-100">价格</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-1 narrow-column">
                  <CopyableCell value="筒灯" />
                </td>
                <td className="border border-gray-300 p-1 ultra-narrow-column">
                  <CopyableCell value="RVS" />
                </td>
                <td className="border border-gray-300 p-2">
                  <CopyableCell value="TEST-001" />
                </td>
                <td className="border border-gray-300 p-2">
                  <CopyableCell value="¥99.99" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-1 narrow-column">
                  <CopyableCell value="射灯" />
                </td>
                <td className="border border-gray-300 p-1 ultra-narrow-column">
                  <CopyableCell value="RVS" />
                </td>
                <td className="border border-gray-300 p-2">
                  <CopyableCell value="TEST-002" />
                </td>
                <td className="border border-gray-300 p-2">
                  <CopyableCell value="¥199.99" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">使用说明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 鼠标悬停在文字上会显示"点击复制文字内容"提示</li>
            <li>• 点击文字即可复制到剪贴板</li>
            <li>• 复制成功后会显示"文字内容已复制到剪贴板"提示</li>
            <li>• 不再显示复制图标，节省空间</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
