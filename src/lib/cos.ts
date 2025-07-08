import COS from 'cos-nodejs-sdk-v5'

// 初始化COS实例
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID!,
  SecretKey: process.env.COS_SECRET_KEY!,
  // 添加调试信息
  FileParallelLimit: 3,
  ChunkParallelLimit: 3,
  ChunkSize: 1024 * 1024,
})

export interface UploadResult {
  url: string
  cosStoragePath: string
  filename: string
  size: number
  mimeType: string
}

/**
 * 上传文件到腾讯云COS
 * @param file 文件对象或Blob对象
 * @param folder 存储文件夹，默认为'xxb'
 * @param customFilename 自定义文件名（可选）
 * @returns 上传结果
 */
export async function uploadToCOS(file: File | Blob, folder: string = 'xxb', customFilename?: string): Promise<UploadResult> {
  try {
    // 生成唯一文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)

    let filename: string
    if (customFilename) {
      filename = customFilename
    } else if (file instanceof File) {
      const fileExtension = file.name.split('.').pop()
      filename = `${timestamp}-${randomStr}.${fileExtension}`
    } else {
      // 对于Blob，默认为PDF
      filename = `${timestamp}-${randomStr}.pdf`
    }

    // COS存储路径
    const cosStoragePath = `${folder}/${filename}`

    // 打印调试信息
    console.log('COS上传参数:', {
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION,
      Key: cosStoragePath,
      fileSize: file.size,
      fileType: file.type
    })

    // 将File或Blob转换为Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 确定Content-Type
    const contentType = file instanceof File ? file.type : 'application/pdf'

    // 上传到COS
    const result = await new Promise<any>((resolve, reject) => {
      cos.putObject({
        Bucket: process.env.COS_BUCKET!,
        Region: process.env.COS_REGION!,
        Key: cosStoragePath,
        Body: buffer,
        ContentType: contentType,
      }, (err, data) => {
        if (err) {
          console.error('COS putObject错误详情:', err)
          reject(err)
        } else {
          console.log('COS putObject成功:', data)
          resolve(data)
        }
      })
    })
    
    // 构建访问URL
    const url = `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com/${cosStoragePath}`
    
    return {
      url,
      cosStoragePath,
      filename,
      size: file.size,
      mimeType: contentType
    }
    
  } catch (error) {
    console.error('COS上传失败:', error)
    throw new Error('文件上传失败')
  }
}

/**
 * 从腾讯云COS删除文件
 * @param cosStoragePath COS存储路径
 */
export async function deleteFromCOS(cosStoragePath: string): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      cos.deleteObject({
        Bucket: process.env.COS_BUCKET!,
        Region: process.env.COS_REGION!,
        Key: cosStoragePath,
      }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  } catch (error) {
    console.error('COS删除失败:', error)
    throw new Error('文件删除失败')
  }
}

/**
 * 检查COS配置是否完整
 */
export function checkCOSConfig(): boolean {
  return !!(
    process.env.COS_SECRET_ID &&
    process.env.COS_SECRET_KEY &&
    process.env.COS_REGION &&
    process.env.COS_BUCKET
  )
}
