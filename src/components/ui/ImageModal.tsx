'use client'

import React, { useState } from 'react'
import { X, ZoomIn, ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageModalProps {
  src: string
  alt: string
  className?: string
  thumbnailClassName?: string
}

export function ImageModal({ src, alt, className, thumbnailClassName }: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(!!src) // 只有当有src时才显示加载状态
  const [hasError, setHasError] = useState(false)

  // 当src改变时重置状态
  React.useEffect(() => {
    if (src) {
      setIsLoading(true)
      setHasError(false)
    } else {
      setIsLoading(false)
      setHasError(false)
    }
  }, [src])

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

  const handleImageLoad = () => {
    console.log('图片加载成功:', src)
    setIsLoading(false)
    setHasError(false)
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('图片加载失败:', src, e)
    setIsLoading(false)
    setHasError(true)
  }

  const handleThumbnailClick = () => {
    if (!hasError) {
      setIsOpen(true)
    }
  }

  return (
    <>
      {/* 缩略图 */}
      <div
        className={cn(
          'relative group overflow-hidden rounded border',
          hasError ? 'cursor-default' : 'cursor-pointer',
          thumbnailClassName
        )}
        onClick={handleThumbnailClick}
      >
        {/* 加载状态 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}

        {/* 错误状态 */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center text-gray-400">
              <ImageIcon className="h-6 w-6 mb-1" />
              <span className="text-xs">加载失败</span>
            </div>
          </div>
        )}

        {/* 图片 */}
        {!hasError && (
          <img
            src={src}
            alt={alt}
            className={cn(
              "w-full h-full object-cover transition-transform",
              "group-hover:scale-105",
              isLoading && "opacity-0" // 加载时透明
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* 悬停效果 */}
        {!hasError && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
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
              onError={(e) => {
                // 如果模态框中的图片也加载失败，关闭模态框
                setIsOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
