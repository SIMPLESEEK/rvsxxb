'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, ZoomIn, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageThumbnailProps {
  src: string
  alt: string
  className?: string
  thumbnailClassName?: string
  lazy?: boolean // 是否启用懒加载
}

export function ImageThumbnail({ src, alt, className, thumbnailClassName, lazy = true }: ImageThumbnailProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error' | 'empty'>('empty')
  const [shouldLoad, setShouldLoad] = useState(false)
  const [loadKey, setLoadKey] = useState(0) // 用于强制重新加载
  const imgRef = useRef<HTMLDivElement>(null)

  // 当src改变时，重置所有状态
  useEffect(() => {
    console.log('ImageThumbnail: src 改变，重置状态:', src)

    // 增加loadKey来强制重新加载
    setLoadKey(prev => prev + 1)

    if (!src) {
      setImageState('empty')
      setShouldLoad(false)
      return
    }

    // 重置状态
    setShouldLoad(false)

    // 如果不启用懒加载，立即开始加载
    if (!lazy) {
      console.log('ImageThumbnail: 非懒加载模式，立即开始加载')
      setShouldLoad(true)
      setImageState('loading')
    } else {
      setImageState('empty')
    }
  }, [src, lazy])

  // 懒加载逻辑
  useEffect(() => {
    if (!lazy || shouldLoad || !src || imageState !== 'empty') {
      return
    }

    console.log('ImageThumbnail: 设置懒加载观察器')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('ImageThumbnail: IntersectionObserver 触发，开始加载图片:', src)
            setShouldLoad(true)
            setImageState('loading')
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '100px' // 提前100px开始加载
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [lazy, shouldLoad, src, imageState])

  // 当shouldLoad变为true且状态为empty时，开始加载图片
  useEffect(() => {
    if (!src || !shouldLoad || imageState !== 'empty') return

    console.log('ImageThumbnail: shouldLoad为true，开始加载图片:', src)
    setImageState('loading')
  }, [src, shouldLoad, imageState])

  // 处理图片加载成功
  const handleImageLoad = () => {
    console.log('图片加载成功:', src)
    setImageState('loaded')
  }

  // 处理图片加载失败
  const handleImageError = () => {
    console.log('图片加载失败:', src)
    setImageState('error')
  }

  // 空状态
  if (imageState === 'empty') {
    return (
      <div
        ref={imgRef}
        className={cn(
          'flex items-center justify-center bg-gray-100 border border-gray-200 rounded',
          thumbnailClassName
        )}
      >
        <div className="flex flex-col items-center text-gray-400">
          <ImageIcon className="h-6 w-6 mb-1" />
          <span className="text-xs">暂无图片</span>
        </div>
      </div>
    )
  }

  // 懒加载等待状态
  if (lazy && !shouldLoad) {
    return (
      <div
        ref={imgRef}
        className={cn(
          'flex items-center justify-center bg-gray-100 border border-gray-200 rounded',
          thumbnailClassName
        )}
      >
        <div className="flex flex-col items-center text-gray-400">
          <ImageIcon className="h-4 w-4 mb-1" />
          <span className="text-xs">等待加载</span>
        </div>
      </div>
    )
  }

  // 错误状态
  if (imageState === 'error') {
    return (
      <div className={cn(
        'flex items-center justify-center bg-red-50 border-2 border-red-300 rounded',
        thumbnailClassName
      )}>
        <div className="flex flex-col items-center text-red-500">
          <ImageIcon className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">加载失败</span>
        </div>
      </div>
    )
  }

  // 加载状态 - 直接显示图片，不使用预加载
  if (imageState === 'loading') {
    return (
      <div
        ref={imgRef}
        className={cn(
          'relative overflow-hidden rounded border bg-gray-100',
          thumbnailClassName
        )}
      >
        {/* 直接显示图片 */}
        <img
          key={`loading-${loadKey}`}
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
        {/* 加载指示器覆盖在图片上方 */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 z-10">
          <div className="flex flex-col items-center text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            <span className="text-xs mt-1">加载中</span>
          </div>
        </div>
      </div>
    )
  }

  // 成功加载状态
  return (
    <>
      {/* 缩略图 */}
      <div
        ref={imgRef}
        className={cn(
          'relative group cursor-pointer overflow-hidden rounded border bg-gray-100',
          thumbnailClassName
        )}
        onClick={() => setIsOpen(true)}
      >
        <img
          key={`loaded-${loadKey}`}
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={handleImageError}
          loading="lazy"
        />
      </div>

      {/* 模态框 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/20"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative w-[95vw] h-[95vh] max-w-6xl p-4 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
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
