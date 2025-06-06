'use client'

import React, { useState, useEffect } from 'react'
import { copyToClipboard } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CopyableCellProps {
  value: string
  className?: string
}

export function CopyableCell({ value, className }: CopyableCellProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!value) return

    try {
      await copyToClipboard(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  if (!value) {
    return <span className="text-gray-400">-</span>
  }

  return (
    <div className="relative">
      <span
        className={cn(
          'cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors block w-full',
          className
        )}
        onClick={handleCopy}
        title={copied ? '' : '点击可复制文字内容'}
      >
        {value}
      </span>

      {/* 复制成功提示 */}
      {copied && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-green-600 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
          已复制
        </div>
      )}
    </div>
  )
}
