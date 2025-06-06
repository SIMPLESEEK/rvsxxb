'use client'

import React, { useState } from 'react'
import { X, ZoomIn, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimpleImageModalProps {
  src: string
  alt: string
  className?: string
  thumbnailClassName?: string
}

export function SimpleImageModal({ src, alt, className, thumbnailClassName }: SimpleImageModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasError, setHasError] = useState(false)

  // 当src改变时，重置错误状态
  React.useEffect(() => {
    if (src) {
      setHasError(false)
    }
  }, [src])

  // 无图片状态
  if (!src) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gray-100 border border-gray-200 rounded',
        thumbnailClassName
      )}>
        <div className="flex flex-col items-center text-gray-400">
          <ImageIcon className="h-6 w-6 mb-1" />
          <span className="text-xs">无图片</span>
        </div>
      </div>
    )
  }

  // 错误状态
  if (hasError) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-red-50 border-2 border-red-300 rounded',
        thumbnailClassName
      )}>
        <div className="flex flex-col items-center text-red-500">
          <ImageIcon className="h-8 w-8 mb-1" />
          <span className="text-xs font-medium">加载失败</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 缩略图 */}
      <div 
        className={cn(
          'relative group cursor-pointer overflow-hidden rounded border bg-gray-100',
          thumbnailClassName
        )}
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={() => {
            setHasError(true)
          }}
          onLoad={() => {
            setHasError(false) // 成功加载时重置错误状态
          }}
          loading="lazy"
        />
      </div>

      {/* 模态框 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute -top-2 -right-2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              title="关闭图片预览"
              aria-label="关闭图片预览"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={src}
              alt={alt}
              className={cn(
                'max-w-full max-h-full object-contain rounded-lg shadow-2xl',
                className
              )}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  )
}
