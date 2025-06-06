'use client'

import React, { useState, useEffect } from 'react'
import { X, ZoomIn, ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageModalV2Props {
  src: string
  alt: string
  className?: string
  thumbnailClassName?: string
}

export function ImageModalV2({ src, alt, className, thumbnailClassName }: ImageModalV2Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error' | 'empty'>('empty')

  useEffect(() => {
    if (!src) {
      setImageState('empty')
      return
    }

    setImageState('loading')

    // 创建一个新的Image对象来测试加载
    const img = new Image()

    // 设置超时，如果5秒内没有加载完成就认为失败
    const timeout = setTimeout(() => {
      console.log('图片加载超时:', src)
      setImageState('error')
    }, 5000)

    img.onload = () => {
      clearTimeout(timeout)
      console.log('图片预加载成功:', src)
      setImageState('loaded')
    }

    img.onerror = () => {
      clearTimeout(timeout)
      console.log('图片预加载失败:', src)
      setImageState('error')
    }

    // 设置crossOrigin以处理跨域图片
    img.crossOrigin = 'anonymous'
    img.src = src

    // 清理函数
    return () => {
      clearTimeout(timeout)
      img.onload = null
      img.onerror = null
    }
  }, [src])

  // 无图片状态
  if (!src || imageState === 'empty') {
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

  // 加载状态
  if (imageState === 'loading') {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gray-100 border border-gray-200 rounded',
        thumbnailClassName
      )}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    )
  }

  // 错误状态
  if (imageState === 'error') {
    return (
      <div className={cn(
        'flex items-center justify-center bg-red-50 border border-red-200 rounded',
        thumbnailClassName
      )}>
        <div className="flex flex-col items-center text-red-400">
          <ImageIcon className="h-6 w-6 mb-1" />
          <span className="text-xs">加载失败</span>
        </div>
      </div>
    )
  }

  // 成功加载状态
  return (
    <>
      {/* 缩略图 */}
      <div 
        className={cn(
          'relative group cursor-pointer overflow-hidden rounded border',
          thumbnailClassName
        )}
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
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
