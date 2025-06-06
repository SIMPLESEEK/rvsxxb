// 图片缓存管理器
class ImageCacheManager {
  private cache = new Map<string, { 
    status: 'loading' | 'loaded' | 'error',
    image?: HTMLImageElement,
    timestamp: number
  }>()
  
  private maxCacheSize = 100 // 最大缓存数量
  private maxAge = 5 * 60 * 1000 // 5分钟过期

  // 预加载图片
  preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      // 检查缓存
      const cached = this.cache.get(src)
      if (cached) {
        if (cached.status === 'loaded' && cached.image) {
          // 检查是否过期
          if (Date.now() - cached.timestamp < this.maxAge) {
            resolve(cached.image)
            return
          } else {
            // 过期，删除缓存
            this.cache.delete(src)
          }
        } else if (cached.status === 'error') {
          reject(new Error('Image failed to load'))
          return
        }
      }

      // 设置加载状态
      this.cache.set(src, {
        status: 'loading',
        timestamp: Date.now()
      })

      const img = new Image()
      
      img.onload = () => {
        this.cache.set(src, {
          status: 'loaded',
          image: img,
          timestamp: Date.now()
        })
        this.cleanupCache()
        resolve(img)
      }

      img.onerror = () => {
        this.cache.set(src, {
          status: 'error',
          timestamp: Date.now()
        })
        reject(new Error('Image failed to load'))
      }

      // 不设置crossOrigin，避免CORS问题
      img.src = src
    })
  }

  // 检查图片是否已缓存
  isImageCached(src: string): boolean {
    const cached = this.cache.get(src)
    if (!cached) return false
    
    // 检查是否过期
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(src)
      return false
    }
    
    return cached.status === 'loaded'
  }

  // 获取缓存的图片状态
  getImageStatus(src: string): 'loading' | 'loaded' | 'error' | 'not-cached' {
    const cached = this.cache.get(src)
    if (!cached) return 'not-cached'
    
    // 检查是否过期
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(src)
      return 'not-cached'
    }
    
    return cached.status
  }

  // 清理过期缓存
  private cleanupCache() {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    // 删除过期项
    entries.forEach(([src, data]) => {
      if (now - data.timestamp > this.maxAge) {
        this.cache.delete(src)
      }
    })

    // 如果缓存过大，删除最旧的项
    if (this.cache.size > this.maxCacheSize) {
      const sortedEntries = entries
        .filter(([src]) => this.cache.has(src)) // 只保留未被删除的项
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toDelete = sortedEntries.slice(0, this.cache.size - this.maxCacheSize)
      toDelete.forEach(([src]) => this.cache.delete(src))
    }
  }

  // 清空所有缓存
  clearCache() {
    this.cache.clear()
  }

  // 获取缓存统计信息
  getCacheStats() {
    const now = Date.now()
    let loaded = 0
    let loading = 0
    let error = 0
    let expired = 0

    this.cache.forEach((data) => {
      if (now - data.timestamp > this.maxAge) {
        expired++
      } else {
        switch (data.status) {
          case 'loaded': loaded++; break
          case 'loading': loading++; break
          case 'error': error++; break
        }
      }
    })

    return {
      total: this.cache.size,
      loaded,
      loading,
      error,
      expired
    }
  }
}

// 创建全局实例
export const imageCache = new ImageCacheManager()

// 导出类型
export type ImageCacheStatus = 'loading' | 'loaded' | 'error' | 'not-cached'
