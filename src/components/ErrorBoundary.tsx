'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // 检测是否是夸克浏览器特有的错误
    const userAgent = navigator.userAgent.toLowerCase()
    const isQuark = userAgent.includes('quark')
    
    if (isQuark) {
      console.warn('夸克浏览器错误检测:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent
      })
      
      // 尝试应用夸克浏览器特殊修复
      this.applyQuarkFixes()
    }
  }

  applyQuarkFixes = () => {
    try {
      // 强制重新渲染页面元素
      const tables = document.querySelectorAll('table')
      tables.forEach(table => {
        const display = table.style.display
        table.style.display = 'none'
        setTimeout(() => {
          table.style.display = display || 'table'
        }, 10)
      })

      // 重新应用关键样式
      const style = document.createElement('style')
      style.textContent = `
        /* 紧急修复样式 */
        .quotation-table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
        }
        
        .flex {
          display: -webkit-box !important;
          display: flex !important;
        }
        
        .grid {
          display: flex !important;
          flex-wrap: wrap !important;
        }
      `
      document.head.appendChild(style)
      
    } catch (fixError) {
      console.error('应用夸克浏览器修复时出错:', fixError)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // 自定义降级 UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      const userAgent = navigator.userAgent.toLowerCase()
      const isQuark = userAgent.includes('quark')

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <svg 
                className="mx-auto h-12 w-12 text-red-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              页面加载出现问题
            </h1>
            
            <p className="text-gray-600 mb-4">
              {isQuark 
                ? '检测到您使用的是夸克浏览器，可能存在兼容性问题。建议您：'
                : '页面渲染时遇到了错误，请尝试以下解决方案：'
              }
            </p>
            
            <div className="text-left text-sm text-gray-500 mb-6 space-y-2">
              {isQuark ? (
                <>
                  <div>• 刷新页面重新加载</div>
                  <div>• 清除浏览器缓存</div>
                  <div>• 尝试使用Chrome、Edge或Safari浏览器</div>
                  <div>• 更新夸克浏览器到最新版本</div>
                </>
              ) : (
                <>
                  <div>• 刷新页面重新加载</div>
                  <div>• 检查网络连接</div>
                  <div>• 清除浏览器缓存</div>
                  <div>• 尝试使用其他浏览器</div>
                </>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                重新加载
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                刷新页面
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                返回首页
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  查看错误详情 (开发模式)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-40">
                  <div className="font-semibold mb-2">错误信息:</div>
                  <div className="mb-2">{this.state.error.message}</div>
                  
                  {this.state.error.stack && (
                    <>
                      <div className="font-semibold mb-2">错误堆栈:</div>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </>
                  )}
                  
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <div className="font-semibold mb-2 mt-4">组件堆栈:</div>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
            
            <div className="mt-4 text-xs text-gray-400">
              浏览器: {navigator.userAgent}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 高阶组件包装器
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
