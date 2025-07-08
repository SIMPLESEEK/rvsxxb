/**
 * 浏览器兼容性工具函数
 * 专门处理夸克浏览器等移动端浏览器的兼容性问题
 */

// 检测浏览器类型
export function detectBrowser() {
  const userAgent = navigator.userAgent.toLowerCase()
  
  return {
    isQuark: userAgent.includes('quark'),
    isChrome: userAgent.includes('chrome') && !userAgent.includes('edge'),
    isEdge: userAgent.includes('edge'),
    isSafari: userAgent.includes('safari') && !userAgent.includes('chrome'),
    isFirefox: userAgent.includes('firefox'),
    isMobile: /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
    isIOS: /ipad|iphone|ipod/.test(userAgent),
    isAndroid: userAgent.includes('android')
  }
}

// 夸克浏览器特殊处理
export function applyQuarkCompatibility() {
  const browser = detectBrowser()
  
  if (!browser.isQuark) return
  
  console.log('检测到夸克浏览器，应用兼容性修复...')
  
  // 1. 修复CSS Grid兼容性
  fixCSSGridSupport()
  
  // 2. 修复事件处理
  fixEventHandling()
  
  // 3. 修复本地存储
  fixLocalStorage()
  
  // 4. 修复图片加载
  fixImageLoading()
  
  // 5. 修复表格渲染
  fixTableRendering()
}

// 修复CSS Grid支持
function fixCSSGridSupport() {
  // 为不支持CSS Grid的情况添加fallback
  const style = document.createElement('style')
  style.textContent = `
    @supports not (display: grid) {
      .grid {
        display: flex;
        flex-wrap: wrap;
      }
      
      .grid-cols-1 > * { width: 100%; }
      .grid-cols-2 > * { width: 50%; }
      .grid-cols-3 > * { width: 33.333%; }
      .grid-cols-4 > * { width: 25%; }
      .grid-cols-5 > * { width: 20%; }
      .grid-cols-6 > * { width: 16.666%; }
    }
    
    /* 夸克浏览器特殊样式修复 */
    .quark-browser-fix {
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
    }
    
    /* 修复表格在夸克浏览器中的显示问题 */
    .quotation-table {
      border-collapse: separate !important;
      border-spacing: 0 !important;
    }
    
    .quotation-table td,
    .quotation-table th {
      border: 1px solid #e5e7eb !important;
      border-top: none !important;
    }
    
    .quotation-table tr:first-child th {
      border-top: 1px solid #e5e7eb !important;
    }
  `
  document.head.appendChild(style)
}

// 修复事件处理
function fixEventHandling() {
  // 为夸克浏览器添加事件处理兼容性
  const originalAddEventListener = EventTarget.prototype.addEventListener
  
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // 夸克浏览器可能不支持passive选项
    if (typeof options === 'object' && options.passive !== undefined) {
      try {
        return originalAddEventListener.call(this, type, listener, options)
      } catch (e) {
        // 降级到简单的事件监听
        return originalAddEventListener.call(this, type, listener, false)
      }
    }
    
    return originalAddEventListener.call(this, type, listener, options)
  }
}

// 修复本地存储
function fixLocalStorage() {
  // 检查localStorage是否可用
  try {
    const test = 'test'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
  } catch (e) {
    console.warn('localStorage不可用，使用内存存储替代')
    
    // 创建内存存储替代方案
    const memoryStorage: { [key: string]: string } = {}
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => memoryStorage[key] || null,
        setItem: (key: string, value: string) => { memoryStorage[key] = value },
        removeItem: (key: string) => { delete memoryStorage[key] },
        clear: () => { Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]) },
        length: Object.keys(memoryStorage).length,
        key: (index: number) => Object.keys(memoryStorage)[index] || null
      },
      writable: false
    })
  }
  
  // 同样处理sessionStorage
  try {
    const test = 'test'
    sessionStorage.setItem(test, test)
    sessionStorage.removeItem(test)
  } catch (e) {
    console.warn('sessionStorage不可用，使用内存存储替代')
    
    const memorySessionStorage: { [key: string]: string } = {}
    
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: (key: string) => memorySessionStorage[key] || null,
        setItem: (key: string, value: string) => { memorySessionStorage[key] = value },
        removeItem: (key: string) => { delete memorySessionStorage[key] },
        clear: () => { Object.keys(memorySessionStorage).forEach(key => delete memorySessionStorage[key]) },
        length: Object.keys(memorySessionStorage).length,
        key: (index: number) => Object.keys(memorySessionStorage)[index] || null
      },
      writable: false
    })
  }
}

// 修复图片加载
function fixImageLoading() {
  // 为图片添加加载错误处理
  document.addEventListener('error', (e) => {
    const target = e.target as HTMLImageElement
    if (target.tagName === 'IMG') {
      console.warn('图片加载失败:', target.src)
      
      // 添加重试机制
      if (!target.dataset.retryCount) {
        target.dataset.retryCount = '1'
        setTimeout(() => {
          target.src = target.src + '?retry=' + Date.now()
        }, 1000)
      }
    }
  }, true)
}

// 修复表格渲染
function fixTableRendering() {
  // 确保表格在夸克浏览器中正确渲染
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element
          
          // 为新添加的表格元素应用修复
          if (element.tagName === 'TABLE' || element.querySelector('table')) {
            const tables = element.tagName === 'TABLE' ? [element] : element.querySelectorAll('table')
            
            tables.forEach((table) => {
              table.classList.add('quark-browser-fix')
              
              // 强制重新计算布局
              setTimeout(() => {
                const display = table.style.display
                table.style.display = 'none'
                void table.offsetHeight // 触发重排
                table.style.display = display
              }, 0)
            })
          }
        }
      })
    })
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

// 修复CSS变量支持
export function fixCSSVariables() {
  // 检查CSS变量支持
  if (!window.CSS || !window.CSS.supports || !window.CSS.supports('color', 'var(--test)')) {
    console.warn('CSS变量不支持，应用降级方案')
    
    // 添加CSS变量polyfill的基本实现
    const style = document.createElement('style')
    style.textContent = `
      :root {
        background: #ffffff;
        color: #171717;
      }
      
      body {
        background: #ffffff;
        color: #171717;
      }
      
      @media (prefers-color-scheme: dark) {
        :root {
          background: #0a0a0a;
          color: #ededed;
        }
        
        body {
          background: #0a0a0a;
          color: #ededed;
        }
      }
    `
    document.head.appendChild(style)
  }
}

// 修复Flexbox兼容性
export function fixFlexboxSupport() {
  const style = document.createElement('style')
  style.textContent = `
    /* 夸克浏览器Flexbox修复 */
    .flex {
      display: -webkit-box;
      display: -webkit-flex;
      display: -ms-flexbox;
      display: flex;
    }
    
    .flex-col {
      -webkit-box-orient: vertical;
      -webkit-box-direction: normal;
      -webkit-flex-direction: column;
      -ms-flex-direction: column;
      flex-direction: column;
    }
    
    .flex-row {
      -webkit-box-orient: horizontal;
      -webkit-box-direction: normal;
      -webkit-flex-direction: row;
      -ms-flex-direction: row;
      flex-direction: row;
    }
    
    .items-center {
      -webkit-box-align: center;
      -webkit-align-items: center;
      -ms-flex-align: center;
      align-items: center;
    }
    
    .justify-center {
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      -ms-flex-pack: center;
      justify-content: center;
    }
    
    .justify-between {
      -webkit-box-pack: justify;
      -webkit-justify-content: space-between;
      -ms-flex-pack: justify;
      justify-content: space-between;
    }
    
    .flex-1 {
      -webkit-box-flex: 1;
      -webkit-flex: 1;
      -ms-flex: 1;
      flex: 1;
    }
  `
  document.head.appendChild(style)
}

// 初始化兼容性修复
export function initBrowserCompatibility() {
  const browser = detectBrowser()
  
  console.log('浏览器检测结果:', browser)
  
  // 应用通用修复
  fixCSSVariables()
  fixFlexboxSupport()
  
  // 应用夸克浏览器特殊修复
  if (browser.isQuark) {
    applyQuarkCompatibility()
  }
  
  // 移动端特殊处理
  if (browser.isMobile) {
    const style = document.createElement('style')
    style.textContent = `
      /* 移动端优化 */
      * {
        -webkit-tap-highlight-color: transparent;
      }
      
      input, textarea, select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }
      
      /* 防止移动端缩放 */
      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="number"],
      textarea {
        font-size: 16px;
      }
    `
    document.head.appendChild(style)
  }
}
