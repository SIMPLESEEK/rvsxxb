/**
 * 夸克浏览器页眉修复工具
 * 专门解决夸克浏览器页眉重复显示和布局混乱问题
 */

export function detectQuarkBrowser(): boolean {
  return navigator.userAgent.toLowerCase().includes('quark')
}

export function applyQuarkHeaderFix(): () => void {
  if (!detectQuarkBrowser()) {
    return () => {}
  }

  console.log('🔧 应用夸克浏览器简化修复...')

  // 简化的修复：只移除重复的页眉元素
  const removeExtraHeaders = () => {
    const headers = document.querySelectorAll('.bg-white.shadow-sm.border-b')

    headers.forEach((header, index) => {
      if (index > 0) {
        ;(header as HTMLElement).remove()
      }
    })
  }



  // 简化的执行修复
  const runFixes = () => {
    try {
      removeExtraHeaders()
      console.log('✅ 夸克浏览器简化修复完成')
    } catch (error) {
      console.error('❌ 夸克浏览器修复失败:', error)
    }
  }

  // 立即执行一次
  runFixes()

  // 简化的DOM监听，只在检测到新页眉时执行
  const observer = new MutationObserver((mutations) => {
    let shouldFix = false
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element
          if (element.classList?.contains('bg-white') &&
              element.classList?.contains('shadow-sm') &&
              element.classList?.contains('border-b')) {
            shouldFix = true
          }
        }
      })
    })

    if (shouldFix) {
      setTimeout(runFixes, 100)
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  // 返回清理函数
  return () => {
    observer.disconnect()
  }
}


