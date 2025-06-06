'use client'

import { SimpleImageModal } from '@/components/ui/SimpleImageModal'

export default function TestSimpleImagePage() {
  const testImageUrl = "https://xxb-1301676052.cos.ap-guangzhou.myqcloud.com/xxb/1749044584630-n4ecyi.jpg"
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">SimpleImageModal 测试</h1>
        
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold mb-3 text-center">正常图片</h3>
            <div className="flex justify-center">
              <SimpleImageModal
                src={testImageUrl}
                alt="测试图片"
                thumbnailClassName="w-20 h-20"
              />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold mb-3 text-center">无效图片URL</h3>
            <div className="flex justify-center">
              <SimpleImageModal
                src="https://invalid-url.com/image.jpg"
                alt="无效图片"
                thumbnailClassName="w-20 h-20"
              />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold mb-3 text-center">空图片URL</h3>
            <div className="flex justify-center">
              <SimpleImageModal
                src=""
                alt="空图片"
                thumbnailClassName="w-20 h-20"
              />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold mb-3 text-center">另一个正常图片</h3>
            <div className="flex justify-center">
              <SimpleImageModal
                src="https://xxb-1301676052.cos.ap-guangzhou.myqcloud.com/xxb/1749044587964-adpi59.png"
                alt="另一个测试图片"
                thumbnailClassName="w-20 h-20"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">测试说明</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            <li>第一个图片应该正常显示</li>
            <li>第二个图片应该显示"加载失败"的错误状态</li>
            <li>第三个图片应该显示"无图片"的空状态</li>
            <li>第四个图片应该正常显示</li>
            <li>点击正常图片应该能打开模态框查看大图</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
