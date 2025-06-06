'use client'

import React from 'react'
import { ImageModal } from '@/components/ui/ImageModal'

export default function TestImagePage() {
  const testImages = [
    {
      name: '产品图片',
      url: 'https://xxb-1301676052.cos.ap-guangzhou.myqcloud.com/xxb/1749044584630-n4ecyi.jpg'
    },
    {
      name: '尺寸图',
      url: 'https://xxb-1301676052.cos.ap-guangzhou.myqcloud.com/xxb/1749044587964-adpi59.png'
    },
    {
      name: '配件图',
      url: 'https://xxb-1301676052.cos.ap-guangzhou.myqcloud.com/xxb/1749044838033-08058p.jpg'
    },
    {
      name: '无效图片',
      url: 'https://invalid-url.com/nonexistent.jpg'
    },
    {
      name: '空图片',
      url: ''
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">图片组件测试</h1>
        
        <div className="grid grid-cols-5 gap-6">
          {testImages.map((image, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold mb-3 text-center">{image.name}</h3>
              <div className="flex justify-center">
                <ImageModal
                  src={image.url}
                  alt={image.name}
                  thumbnailClassName="w-20 h-20"
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 break-all">
                {image.url || '(空URL)'}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">测试说明</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            <li>前三个图片应该正常显示（如果URL有效）</li>
            <li>第四个图片应该显示"加载失败"的错误状态</li>
            <li>第五个图片显示"无图片"的占位符</li>
            <li>打开浏览器控制台查看加载日志</li>
          </ul>
        </div>

        <div className="mt-4 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">原始img标签测试</h3>
          <div className="grid grid-cols-3 gap-4">
            {testImages.slice(0, 3).map((image, index) => (
              <div key={index} className="text-center">
                <h4 className="text-sm font-medium mb-2">{image.name}</h4>
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-20 h-20 object-cover border rounded mx-auto"
                  onLoad={() => console.log(`原始img加载成功: ${image.name}`)}
                  onError={() => console.log(`原始img加载失败: ${image.name}`)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
