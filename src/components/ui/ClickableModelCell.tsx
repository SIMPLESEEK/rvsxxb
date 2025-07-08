'use client'

import React from 'react'
import { ExternalLink } from 'lucide-react'

interface ClickableModelCellProps {
  model: string
  modelLink?: string
  className?: string
}

export function ClickableModelCell({ model, modelLink, className = '' }: ClickableModelCellProps) {
  if (!model) {
    return <span className="text-gray-400">-</span>
  }

  if (modelLink) {
    return (
      <a
        href={modelLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors touch-manipulation ${className}`}
        title={`点击访问 ${model} 的详细信息`}
        onClick={(e) => {
          // 确保链接点击事件不被阻止
          e.stopPropagation()
        }}
        onTouchStart={(e) => {
          // 移动端触摸事件处理
          e.stopPropagation()
        }}
        style={{
          minHeight: '44px',
          display: 'inline-flex',
          alignItems: 'center',
          padding: '8px 4px'
        }}
      >
        <span className="break-all">{model}</span>
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </a>
    )
  }

  // 如果没有链接，显示普通文本
  return (
    <span className={`break-all ${className}`}>
      {model}
    </span>
  )
}
