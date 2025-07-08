'use client'

import { useEffect } from 'react'

export function BrowserCompatibilityScript() {
  useEffect(() => {
    // 浏览器兼容性检测
    const userAgent = navigator.userAgent
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isQuark = /Quark/i.test(userAgent)

    // 额外的移动端优化
    if (isMobile) {
      console.log('移动端浏览器优化已应用')
    }

    // 夸克浏览器特殊处理
    if (isQuark) {
      console.log('夸克浏览器兼容性优化已应用')
    }

  }, [])

  return null // 这个组件不渲染任何内容
}
