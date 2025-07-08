'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/providers/AuthProvider'
import { Loader2, ArrowLeft, Trash2, Plus, Minus, Download, Printer, Save, FileText, Settings, Edit } from 'lucide-react'
import { Product } from '@/types/product'
import { QuotationTemplate } from '@/types/quotation'
import { ProjectListSave } from '@/lib/models/ProjectListSave'
import { formatPrice, shouldShowPrice } from '@/lib/utils'
import { CompanyInfoEditor } from '@/components/quotation/CompanyInfoEditor'

import * as XLSX from 'xlsx'
import './print.css'

interface ProjectListItem {
  productId: string
  product: Product
  quantity: number
  addedAt: string
  selectedVariables?: {
    colorTemperature?: string
    beamAngle?: string
    appearanceColor?: string
    controlMethod?: string
  }
  generatedModel?: string
  // 新增：价格相关字段
  priceType?: 'factory' | 'market'  // 价格类型：含税价格或市场价格
  unitPrice?: number                // 添加时的单价（根据priceType确定）
}

interface CustomerInfo {
  name: string
  contact: string
  phone: string
  email: string
  projectName: string
}

export default function ProjectListPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [projectList, setProjectList] = useState<ProjectListItem[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [quotationNumber, setQuotationNumber] = useState('')
  const [template, setTemplate] = useState<QuotationTemplate | null>(null)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [savedProjects, setSavedProjects] = useState<ProjectListSave[]>([])
  const [isLoadingSaves, setIsLoadingSaves] = useState(false)

  // 客户信息状态
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    contact: '',
    phone: '',
    email: '',
    projectName: ''
  })
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)

  // 报价说明状态
  const [quotationNotes, setQuotationNotes] = useState('1.报价为人民币（RMB）价格，报价含税，报价有效期6个月；\n2.报价为工厂交易价，不含运费；\n3.产品质保期2年，如非正常使用损坏，费用自理，厂家提供协助维护；')
  const [isEditingNotes, setIsEditingNotes] = useState(false)

  // 优惠金额状态（实际是最终金额）
  const [finalAmount, setFinalAmount] = useState<number>(0)
  const [isEditingFinalAmount, setIsEditingFinalAmount] = useState(false)

  // 获取产品的显示价格（优先使用用户编辑的价格，其次使用添加时保存的价格，最后使用产品默认价格）
  const getDisplayPrice = (item: ProjectListItem): number => {
    // 如果用户手动编辑了价格，优先使用编辑的价格
    if (projectFields[item.productId]?.unitPrice !== undefined) {
      return projectFields[item.productId].unitPrice
    }

    // 检查控制方式，如果不是onoff产品，返回0（需要手动输入）
    const controlMethod = item.selectedVariables?.controlMethod
    if (!shouldShowPrice(controlMethod)) {
      return 0
    }

    // 对于onoff产品，使用添加时保存的价格或产品默认价格
    // 优先使用 savedUnitPrice，然后是 unitPrice，最后是产品默认价格
    const itemWithPrice = item as ProjectListItem & { savedUnitPrice?: number; unitPrice?: number }
    return itemWithPrice.savedUnitPrice || itemWithPrice.unitPrice || item.product.pricing?.unitPrice || 0
  }

  // 获取产品的价格类型标识
  const getPriceTypeLabel = (item: ProjectListItem): string => {
    const priceType = (item as any).priceType
    if (priceType === 'market') {
      return '市场价'
    } else if (priceType === 'factory') {
      return '含税价'
    }
    return '含税价' // 默认为含税价格
  }

  // 判断是否应该显示单价（根据控制方式）
  const shouldShowUnitPrice = (item: ProjectListItem): boolean => {
    const controlMethod = item.selectedVariables?.controlMethod
    console.log('shouldShowUnitPrice调试 - 产品ID:', item.productId)
    console.log('shouldShowUnitPrice调试 - 控制方式:', controlMethod)
    console.log('shouldShowUnitPrice调试 - shouldShowPrice结果:', shouldShowPrice(controlMethod))

    // 临时：强制显示所有产品价格以便调试
    // return true

    return shouldShowPrice(controlMethod)
  }

  // 项目相关字段状态
  const [projectFields, setProjectFields] = useState<{[key: string]: {useArea: string, projectCode: string, remarks: string, model: string, specifications: string, unitPrice: number, quantity: number, productremark: string}}>({})

  // 生成增强的技术参数（包含4个变量参数）
  const generateEnhancedSpecifications = (item: ProjectListItem): string => {
    const baseSpecs = item.product.specifications?.detailed || ''

    // 如果没有选择的变量参数，直接返回原始技术参数
    if (!item.selectedVariables) {
      return baseSpecs
    }

    const { selectedVariables } = item
    const variableSpecs: string[] = []

    // 添加4个变量参数到技术参数
    if (selectedVariables.colorTemperature) {
      variableSpecs.push(`色温: ${selectedVariables.colorTemperature}`)
    }
    if (selectedVariables.beamAngle) {
      variableSpecs.push(`光束角: ${selectedVariables.beamAngle}`)
    }
    if (selectedVariables.appearanceColor) {
      variableSpecs.push(`外观颜色: ${selectedVariables.appearanceColor}`)
    }
    if (selectedVariables.controlMethod) {
      variableSpecs.push(`控制方式: ${selectedVariables.controlMethod}`)
    }

    // 如果有变量参数，将其添加到原始技术参数后面
    if (variableSpecs.length > 0) {
      const separator = baseSpecs ? '\n' : ''
      return baseSpecs + separator + variableSpecs.join('\n')
    }

    return baseSpecs
  }

  // 更新项目字段
  const updateProjectField = (productId: string, field: 'useArea' | 'projectCode' | 'remarks' | 'model' | 'specifications' | 'unitPrice' | 'quantity' | 'productremark' | 'unitPriceInput', value: string | number | undefined) => {
    setProjectFields(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId], // 保留现有的所有字段
        [field]: value      // 只更新指定的字段
      }
    }))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (mounted) {
      loadProjectList()
      loadTemplate()
    }
  }, [mounted])

  // 自动调整价格字体大小
  const adjustPriceFontSize = () => {
    // 查找所有价格元素，包括隐藏的
    const priceElements = document.querySelectorAll('.price-auto-scale')
    console.log(`找到 ${priceElements.length} 个价格元素`)

    priceElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement
      const text = htmlElement.textContent || ''
      const length = text.length

      // 获取元素的类名和位置信息用于调试
      const classes = htmlElement.className
      const isHidden = classes.includes('hidden')
      const isPrintOnly = classes.includes('print:inline')

      console.log(`价格元素 ${index + 1}:`)
      console.log(`  文本: "${text}" (长度: ${length})`)
      console.log(`  类名: ${classes}`)
      console.log(`  是否隐藏: ${isHidden}`)
      console.log(`  是否仅打印显示: ${isPrintOnly}`)

      // 移除之前的长度属性
      htmlElement.removeAttribute('data-length')

      // 根据文本长度设置不同的字体大小和换行策略
      let strategy = 'normal'
      if (length > 16) {
        // 超长文本：强制换行
        htmlElement.setAttribute('data-length', 'force-wrap')
        strategy = 'force-wrap'
      } else if (length > 13) {
        // 很长文本：最小字体，单行显示
        htmlElement.setAttribute('data-length', 'extra-long')
        strategy = 'extra-long'
      } else if (length > 10) {
        // 长文本：缩小字体，单行显示
        htmlElement.setAttribute('data-length', 'very-long')
        strategy = 'very-long'
      } else if (length > 8) {
        // 中等长度：稍微缩小字体
        htmlElement.setAttribute('data-length', 'long')
        strategy = 'long'
      }

      console.log(`  应用策略: ${strategy}`)
      console.log('---')
    })
  }

  // 调试：监听项目清单数据变化
  useEffect(() => {
    if (projectList.length > 0) {
      console.log('项目清单数据更新:', projectList)
      console.log('第一个产品的详细信息:', {
        product: projectList[0].product,
        selectedVariables: projectList[0].selectedVariables,
        generatedModel: projectList[0].generatedModel,
        specifications: projectList[0].product?.specifications
      })

      // 延迟调整价格字体大小，确保DOM已更新
      setTimeout(() => {
        adjustPriceFontSize()
      }, 100)
    }
  }, [projectList])

  // 监听projectFields变化，重新调整字体大小
  useEffect(() => {
    setTimeout(() => {
      adjustPriceFontSize()
    }, 100)
  }, [projectFields])

  // 监听打印事件
  useEffect(() => {
    const handleBeforePrint = () => {
      console.log('准备打印，调整价格字体大小...')
      adjustPriceFontSize()
    }

    const handleAfterPrint = () => {
      console.log('打印完成')
    }

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  // 当用户信息加载完成后生成报价单号
  useEffect(() => {
    if (user && !quotationNumber) {
      generateQuotationNumber()
    }
  }, [user, quotationNumber])

  // 从模板加载报价说明
  useEffect(() => {
    if (template?.quotationNotes) {
      setQuotationNotes(template.quotationNotes)
    }
  }, [template])

  const loadTemplate = async () => {
    try {
      setIsLoadingTemplate(true)
      const response = await fetch('/api/quotation-templates', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取模板失败')
      }

      const data = await response.json()
      setTemplate(data.template)
    } catch (error: any) {
      console.error('获取模板失败:', error)
      // 使用默认模板
      setTemplate({
        userId: user?.id || '',
        companyInfo: {
          name: '上海芮维溪智能科技有限公司',
          brandName: 'RVS Lighting',
          phone: '13816748753',
          email: 'EVA@RVS-LIGHTING.COM',
          contactPerson: 'EVA',
          address: '上海市'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } finally {
      setIsLoadingTemplate(false)
    }
  }

  const loadProjectList = () => {
    try {
      setIsLoadingList(true)
      // 从URL参数或sessionStorage获取项目清单数据
      const urlParams = new URLSearchParams(window.location.search)
      const listData = urlParams.get('data')

      if (listData) {
        // 从URL参数获取数据
        const parsedList = JSON.parse(decodeURIComponent(listData))
        console.log('从URL加载项目清单数据:', parsedList)
        setProjectList(parsedList)
      } else {
        // 从sessionStorage获取数据（临时存储）
        const savedList = sessionStorage.getItem('projectList')
        if (savedList) {
          const parsedList = JSON.parse(savedList)
          console.log('从sessionStorage加载项目清单数据:', parsedList)
          // 检查每个产品的控制方式和价格数据
          parsedList.forEach((item: any, index: number) => {
            console.log(`产品 ${index + 1} 数据分析:`, {
              productId: item.productId,
              controlMethod: item.selectedVariables?.controlMethod,
              savedUnitPrice: item.unitPrice,
              productPricing: item.product?.pricing?.unitPrice,
              priceType: item.priceType,
              shouldShowPrice: shouldShowPrice(item.selectedVariables?.controlMethod)
            })
          })
          setProjectList(parsedList)
        }
      }
    } catch (error) {
      console.error('加载项目清单失败:', error)
    } finally {
      setIsLoadingList(false)
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId)
      return
    }

    const updatedList = projectList.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    )
    setProjectList(updatedList)
    // 临时保存到sessionStorage
    sessionStorage.setItem('projectList', JSON.stringify(updatedList))
  }

  const removeItem = (productId: string) => {
    const updatedList = projectList.filter(item => item.productId !== productId)
    setProjectList(updatedList)
    sessionStorage.setItem('projectList', JSON.stringify(updatedList))
  }

  const clearAll = () => {
    if (confirm('确定要清空所有项目清单吗？')) {
      setProjectList([])
      sessionStorage.removeItem('projectList')
    }
  }

  const calculateTotal = () => {
    return projectList.reduce((total, item) => {
      // 计算所有有价格的产品（包括手动输入的价格）
      const price = getDisplayPrice(item)
      const quantity = item.quantity // 使用projectList中的数量，与界面显示保持一致

      // 如果有价格（大于0），则计入总计
      if (price > 0) {
        return total + (price * quantity)
      }
      return total
    }, 0)
  }

  const generateQuotationNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const uid = user?.id?.slice(-2) || '00' // 取用户ID后两位
    const sequence = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    const number = `RQ-${uid}${year}${month}${sequence}A`
    setQuotationNumber(number)
    return number
  }

  // 暂存功能 - 保存到数据库
  const handleSave = async () => {
    try {
      setIsProcessing(true)

      // 检查是否已达到暂存限制
      if (savedProjects.length >= 5) {
        alert('暂存已满（5/5）\n\n请点击"导入"按钮删除不需要的暂存项目')
        return
      }

      // 生成暂存名称
      const now = new Date()
      const saveName = `${customerInfo.name || '未命名客户'}_${now.toLocaleDateString('zh-CN')}_${now.toLocaleTimeString('zh-CN', { hour12: false })}`

      const saveData = {
        name: saveName,
        projectList,
        customerInfo,
        quotationNotes,
        quotationNumber,
        projectFields,
        finalAmount
      }

      const response = await fetch('/api/project-list-saves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '暂存失败')
      }

      alert('项目清单已暂存到数据库')
    } catch (error: any) {
      alert(`暂存失败: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // 加载暂存列表
  const loadSavedProjects = async () => {
    try {
      setIsLoadingSaves(true)
      const response = await fetch('/api/project-list-saves', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取暂存列表失败')
      }

      const data = await response.json()
      setSavedProjects(data.saves)
    } catch (error: any) {
      console.error('获取暂存列表失败:', error)
      alert(`获取暂存列表失败: ${error.message}`)
    } finally {
      setIsLoadingSaves(false)
    }
  }

  // 导入暂存的项目清单
  const handleImport = async (saveId: string) => {
    try {
      const response = await fetch(`/api/project-list-saves/${saveId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('导入失败')
      }

      const data = await response.json()
      const save = data.save

      // 恢复数据
      setProjectList(save.projectList)
      setCustomerInfo(save.customerInfo)
      setProjectFields(save.projectFields)
      // 恢复优惠金额
      setFinalAmount(save.finalAmount || 0)
      // 如果暂存中有报价单号则使用，否则生成新的
      if (save.quotationNumber && save.quotationNumber.trim() !== '') {
        setQuotationNumber(save.quotationNumber)
      } else {
        generateQuotationNumber()
      }

      // 重新加载用户模板以确保使用当前账号的模板设置
      await loadTemplate()

      // 如果暂存中有报价说明且当前模板没有报价说明，则使用暂存的报价说明
      // 否则优先使用模板中的报价说明
      if (save.quotationNotes && (!template?.quotationNotes || template.quotationNotes.trim() === '')) {
        setQuotationNotes(save.quotationNotes)
      }

      // 同时保存到sessionStorage以保持兼容性
      sessionStorage.setItem('projectList', JSON.stringify(save.projectList))

      setShowImportDialog(false)
      alert('项目清单导入成功')
    } catch (error: any) {
      alert(`导入失败: ${error.message}`)
    }
  }

  // 删除暂存
  const handleDeleteSave = async (saveId: string) => {
    if (!confirm('确定要删除这个暂存吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/project-list-saves/${saveId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      // 重新加载列表
      loadSavedProjects()
      alert('暂存删除成功')
    } catch (error: any) {
      alert(`删除失败: ${error.message}`)
    }
  }

  // 上传文件到COS的通用函数
  const uploadFileToCOS = async (blob: Blob, filename: string, fileType: string, quotationNum?: string) => {
    try {
      // 使用传入的报价单号或当前状态中的报价单号
      const currentQuotationNumber = quotationNum || quotationNumber

      console.log('开始上传文件到COS:', {
        filename,
        fileType,
        quotationNumber: currentQuotationNumber,
        blobSize: blob.size
      })

      // 检查必要参数
      if (!currentQuotationNumber) {
        throw new Error('报价单号为空，无法上传文件')
      }

      if (!blob || blob.size === 0) {
        throw new Error('文件内容为空，无法上传')
      }

      const formData = new FormData()
      const file = new File([blob], filename, { type: fileType })
      formData.append('file', file)
      formData.append('quotationNumber', currentQuotationNumber)

      console.log('发送上传请求...')
      const response = await fetch('/api/upload-quotation', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      console.log('上传响应状态:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('上传失败响应:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || `上传失败 (${response.status})`)
      }

      const data = await response.json()
      console.log('文件上传成功:', data)
      return data
    } catch (error) {
      console.error('上传到COS失败:', error)
      throw error
    }
  }



  // 清理图片错误的函数
  const cleanupImageErrors = () => {
    // 隐藏所有加载失败的图片
    const failedImages = document.querySelectorAll('img')
    failedImages.forEach(img => {
      if (!img.complete || img.naturalHeight === 0) {
        img.style.display = 'none'
        const parent = img.parentElement
        if (parent) {
          const placeholder = document.createElement('div')
          placeholder.className = 'w-24 h-24 bg-gray-200 mx-auto rounded flex items-center justify-center text-sm text-gray-500'
          placeholder.textContent = '无图'
          parent.appendChild(placeholder)
        }
      }
    })
  }

  // 打印功能
  const handlePrint = async () => {
    try {
      console.log('=== 打印调试信息 ===')
      console.log('当前页面URL:', window.location.href)

      // 清理图片错误
      cleanupImageErrors()

      // 检查表格列标题
      const tableHeaders = document.querySelectorAll('.quotation-table th')
      console.log('表格列标题:')
      tableHeaders.forEach((header, index) => {
        console.log(`第${index + 1}列:`, header.textContent?.trim())
      })

      // 确保报价单号存在
      let currentQuotationNumber = quotationNumber
      if (!currentQuotationNumber || currentQuotationNumber.trim() === '') {
        console.log('报价单号为空，正在生成...')
        currentQuotationNumber = generateQuotationNumber()
      }

      // 设置页面数据属性用于页眉页脚
      const now = new Date()
      const printTime = `打印时间: ${now.toLocaleDateString('zh-CN')} ${now.toLocaleTimeString('zh-CN')}`
      const quotationHeader = `${currentQuotationNumber} - RVS LIGHTING 报价单`

      document.documentElement.setAttribute('data-print-time', printTime)
      document.documentElement.setAttribute('data-quotation-header', quotationHeader)

      // 在打印前调整价格字体大小
      console.log('打印前调整价格字体大小...')
      adjustPriceFontSize()

      // 直接打印，不需要生成PDF
      window.print()

      // 清除数据属性
      setTimeout(() => {
        document.documentElement.removeAttribute('data-print-time')
        document.documentElement.removeAttribute('data-quotation-header')
      }, 1000)

      // 已取消自动上传PDF到COS功能
    } catch (error) {
      alert('打印失败，请重试')
    }
  }

  // 优化的浏览器打印PDF导出
  const handleSimplePDFExport = async () => {
    try {
      console.log('开始浏览器打印PDF导出...')

      // 确保报价单号存在
      let currentQuotationNumber = quotationNumber
      if (!currentQuotationNumber || currentQuotationNumber.trim() === '') {
        console.log('报价单号为空，正在生成...')
        currentQuotationNumber = generateQuotationNumber()
      }

      // 临时修改页面标题（这将成为浏览器保存PDF时的默认文件名）
      const originalTitle = document.title
      document.title = `${currentQuotationNumber} - RVS Lighting 报价单`

      // 设置页面数据属性用于页眉页脚
      const now = new Date()
      const printTime = `打印时间: ${now.toLocaleDateString('zh-CN')} ${now.toLocaleTimeString('zh-CN')}`
      const quotationHeader = `${currentQuotationNumber} - RVS LIGHTING 报价单`

      document.documentElement.setAttribute('data-print-time', printTime)
      document.documentElement.setAttribute('data-quotation-header', quotationHeader)

      // 添加打印提示
      const printTip = document.createElement('div')
      printTip.id = 'print-tip'
      printTip.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 8px;
                    z-index: 9999; font-family: Arial, sans-serif; text-align: center;">
          <p>请在打印对话框中选择"另存为PDF"</p>
          <p>或选择PDF打印机进行保存</p>
          <button onclick="this.parentElement.parentElement.remove()"
                  style="margin-top: 10px; padding: 5px 15px; background: #007bff; color: white;
                         border: none; border-radius: 4px; cursor: pointer;">
            我知道了
          </button>
        </div>
      `
      document.body.appendChild(printTip)

      // 隐藏不需要的元素
      const navbar = document.querySelector('nav')
      const pageHeader = document.querySelector('main > div:first-child')
      const modals = document.querySelectorAll('.fixed.inset-0')

      const originalDisplays: string[] = []
      const elementsToHide = [navbar, pageHeader, ...Array.from(modals)].filter(Boolean)

      elementsToHide.forEach((el, index) => {
        if (el) {
          const htmlEl = el as HTMLElement
          originalDisplays[index] = htmlEl.style.display || ''
          htmlEl.style.display = 'none'
        }
      })

      // 确保报价单内容可见
      const quotationContent = document.getElementById('quotation-content')
      if (quotationContent) {
        quotationContent.style.boxShadow = 'none'
        quotationContent.style.margin = '0'
        quotationContent.style.borderRadius = '0'
      }

      // 延迟执行打印，确保样式应用完成
      setTimeout(() => {
        // 移除提示
        const tip = document.getElementById('print-tip')
        if (tip) tip.remove()

        // 执行打印
        window.print()

        // 恢复原始状态
        setTimeout(async () => {
          document.title = originalTitle
          document.documentElement.removeAttribute('data-print-time')
          document.documentElement.removeAttribute('data-quotation-header')
          elementsToHide.forEach((el, index) => {
            if (el) {
              const htmlEl = el as HTMLElement
              htmlEl.style.display = originalDisplays[index]
            }
          })

          if (quotationContent) {
            quotationContent.style.boxShadow = ''
            quotationContent.style.margin = ''
            quotationContent.style.borderRadius = ''
          }

          // 已取消自动上传PDF到COS功能
        }, 500)
      }, 2000) // 给用户2秒时间阅读提示

    } catch (error) {
      console.error('打印PDF失败:', error)
      alert(`打印PDF失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 导出Excel功能（增强版本，支持格式化）
  const handleExportExcel = async () => {
    try {
      setIsProcessing(true)
      console.log('开始导出Excel...')

      // 确保报价单号存在
      let currentQuotationNumber = quotationNumber
      if (!currentQuotationNumber || currentQuotationNumber.trim() === '') {
        console.log('报价单号为空，正在生成...')
        currentQuotationNumber = generateQuotationNumber()
      }

      // 准备Excel数据
      const companyName = template?.companyInfo?.name || '上海内雅美智能科技有限公司'
      const brandName = template?.companyInfo?.brandName || 'RVS Lighting'
      const excelData = [
        [`${brandName} 报价单`],
        [''],
        ['报价单号:', currentQuotationNumber],
        ['日期:', new Date().toLocaleDateString('zh-CN')],
        ['客户名称:', customerInfo.name],
        ['联系人:', customerInfo.contact],
        ['电话:', customerInfo.phone],
        [''],
        ['序号', '使用区域', '订货代码', '品牌', '技术参数', '单价', '数量', '单位', '小计', '报价备注'],
        ...projectList.map((item, index) => [
          String(index + 1).padStart(3, '0'),
          projectFields[item.productId]?.useArea || '',
          projectFields[item.productId]?.model || item.generatedModel || item.product.model || '-',
          item.product.brand || 'RVS',
          projectFields[item.productId]?.specifications || generateEnhancedSpecifications(item) || '-',
          getDisplayPrice(item) > 0 ? getDisplayPrice(item) : '-',
          item.quantity,
          'PCS',
          getDisplayPrice(item) > 0 ? getDisplayPrice(item) * item.quantity : '-',
          projectFields[item.productId]?.remarks || item.product.productremark || item.product.notes || ''
        ]),
        [''],
        ['合计金额:', '', '', '', '', '', '', '', '', calculateTotal()],
        ...(finalAmount > 0 ? [['优惠金额:', '', '', '', '', '', '', '', '', finalAmount]] : []),
        [''],
        ['报价说明:'],
        ...quotationNotes.split('\n').map(line => [line]),
        [''],
        [companyName]
      ]

      // 创建工作簿
      const ws = XLSX.utils.aoa_to_sheet(excelData)
      const wb = XLSX.utils.book_new()

      // 设置列宽
      const colWidths = [
        { wch: 6 },   // 序号
        { wch: 15 },  // 使用区域
        { wch: 15 },  // 订货代码
        { wch: 8 },   // 品牌
        { wch: 40 },  // 技术参数
        { wch: 10 },  // 单价
        { wch: 8 },   // 数量
        { wch: 8 },   // 单位
        { wch: 12 },  // 小计
        { wch: 20 }   // 报价备注
      ]
      ws['!cols'] = colWidths

      // 设置样式
      const headerRowIndex = 8 // 表头行索引（从0开始）
      const dataStartRow = 9   // 数据开始行索引
      const dataEndRow = dataStartRow + projectList.length - 1 // 数据结束行索引

      // 标题样式
      if (ws['A1']) {
        ws['A1'].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: 'center' }
        }
      }

      // 表头样式
      const headerCells = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
      headerCells.forEach(col => {
        const cellRef = `${col}${headerRowIndex + 1}`
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'F3F4F6' } },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            },
            alignment: { horizontal: 'center' }
          }
        }
      })

      // 数据行样式
      for (let row = dataStartRow; row <= dataEndRow; row++) {
        headerCells.forEach((col, colIndex) => {
          const cellRef = `${col}${row + 1}`
          if (ws[cellRef]) {
            ws[cellRef].s = {
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              },
              alignment: {
                horizontal: colIndex === 0 || colIndex === 5 || colIndex === 6 || colIndex === 7 || colIndex === 8 ? 'center' : 'left',
                vertical: 'center'
              }
            }

            // 价格列格式化
            if (colIndex === 5 || colIndex === 8) { // 单价和小计列
              ws[cellRef].s.numFmt = '¥#,##0.00'
            }
          }
        })
      }

      // 合计行样式
      const totalRowIndex = dataEndRow + 2
      const totalCellRef = `I${totalRowIndex + 1}`
      if (ws[totalCellRef]) {
        ws[totalCellRef].s = {
          font: { bold: true },
          numFmt: '¥#,##0.00',
          border: {
            top: { style: 'thick' },
            bottom: { style: 'thick' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, '报价单')

      // 生成Excel文件的Blob
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      // 下载Excel文件
      const filename = `${currentQuotationNumber}.xlsx`
      const url = window.URL.createObjectURL(excelBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      // 已取消自动上传Excel到COS功能

      alert('Excel文件已导出成功')
    } catch (error) {
      console.error('导出Excel失败:', error)
      alert('导出Excel失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading || isLoadingList || isLoadingTemplate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-3 sm:py-6 px-2 sm:px-4 lg:px-8">
        {/* 项目清单内容 */}
        {!mounted || isLoadingList ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          </div>
        ) : projectList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-gray-400 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">项目清单为空</h3>
            <p className="text-gray-600 mb-6">
              请返回产品选型表，点击&quot;+&quot;按钮添加产品到项目清单
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={() => router.push('/product-list-v3')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                返回产品选型表
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowImportDialog(true)
                  loadSavedProjects()
                }}
                className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="w-4 h-4 mr-2" />
                导入暂存清单
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 操作按钮区域 */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/product-list-v3')}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">返回首页</span>
                    <span className="sm:hidden">返回</span>
                  </button>

                  {/* PC端显示设置按钮 */}
                  <button
                    type="button"
                    onClick={() => setShowTemplateEditor(true)}
                    disabled={isProcessing}
                    className="hidden sm:inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span>模板设置</span>
                  </button>

                  {/* 移动端显示提示文字 */}
                  <div className="sm:hidden text-xs text-gray-500 px-2 py-2 bg-gray-50 rounded border">
                    请使用电脑浏览器设置项目清单模板信息
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isProcessing || projectList.length === 0}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-blue-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {isProcessing ? '暂存中...' : '暂存'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowImportDialog(true)
                      loadSavedProjects()
                    }}
                    disabled={isProcessing}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-green-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    导入
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={isProcessing || projectList.length === 0}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-purple-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">打印</span>
                    <span className="sm:hidden">打印</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={isProcessing || projectList.length === 0}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-green-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">导出Excel</span>
                    <span className="sm:hidden">Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimplePDFExport}
                    disabled={isProcessing || projectList.length === 0}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-red-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">导出PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={isProcessing || projectList.length === 0}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空清单
                  </button>
                </div>
              </div>
            </div>

            <div id="quotation-content" className="bg-white quotation-preview">
            {/* 报价单头部 */}
            <div className="quotation-header">
              {/* PC端头部布局 */}
              <div className="hidden sm:block print:hidden p-4">
                {/* LOGO和报价单字样居中 */}
                <div className="text-center mb-4">
                  <div className="inline-flex items-center space-x-6">
                    {template?.companyInfo?.logo && (
                      <img
                        src={template.companyInfo.logo}
                        alt="公司LOGO"
                        className="h-10 w-auto max-h-10 max-w-[120px] object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <span className="text-lg font-bold">{template?.companyInfo?.brandName || 'RVS Lighting'} 报价单</span>
                  </div>
                </div>
                {/* 报价单编码和日期右对齐 */}
                <div className="text-right text-sm">
                  <div>RQ: {quotationNumber}</div>
                  <div>{new Date().toLocaleDateString('zh-CN')}</div>
                </div>
              </div>

              {/* 移动端头部布局 */}
              <div className="sm:hidden print:hidden p-3">
                {/* 移动端标题卡片 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-3 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {template?.companyInfo?.logo && (
                        <img
                          src={template.companyInfo.logo}
                          alt="公司LOGO"
                          className="h-8 w-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {template?.companyInfo?.brandName || 'RVS Lighting'}
                        </div>
                        <div className="text-xs text-gray-600">报价单</div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                      <div className="font-medium">{quotationNumber}</div>
                      <div>{new Date().toLocaleDateString('zh-CN')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PC端打印时显示的头部 */}
              <div className="hidden print:block p-4">
                {/* LOGO和报价单字样居中 */}
                <div className="text-center mb-4">
                  <div className="inline-flex items-center space-x-6">
                    {template?.companyInfo?.logo && (
                      <img
                        src={template.companyInfo.logo}
                        alt="公司LOGO"
                        className="h-10 w-auto max-h-10 max-w-[120px] object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <span className="text-lg font-bold">{template?.companyInfo?.brandName || 'RVS Lighting'} 报价单</span>
                  </div>
                </div>
                {/* 报价单编码和日期右对齐 */}
                <div className="text-right text-sm">
                  <div>RQ: {quotationNumber}</div>
                  <div>{new Date().toLocaleDateString('zh-CN')}</div>
                </div>
              </div>

              {/* PC端客户信息区域 */}
              <div className="hidden sm:block print:hidden p-4 text-sm customer-info">
                <div className="space-y-2">
                  {/* To（报价对象）信息 - 左右布局 */}
                  <div className="flex gap-4">
                    {/* 左侧：客户名称、项目名称、联系人 */}
                    <div className="flex-1 space-y-1">
                      {/* 客户名称 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">To</span>
                        <span className="font-medium w-16">客户名称:</span>
                        <div className="flex items-center flex-1">
                          {isEditingCustomer ? (
                            <input
                              type="text"
                              value={customerInfo.name}
                              onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                              className="bg-transparent outline-none flex-1"
                              placeholder="客户名称"
                            />
                          ) : (
                            <span className="flex-1">{customerInfo.name}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                            className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 rounded-md border border-blue-300 print:hidden transition-colors"
                            style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' }}
                            title={isEditingCustomer ? "保存客户信息" : "编辑客户信息"}
                          >
                            <Edit className="w-4 h-4" style={{ color: 'inherit' }} />
                          </button>
                        </div>
                      </div>

                      {/* 项目名称 */}
                      <div className="flex items-center">
                        <span className="w-12">&nbsp;</span>
                        <span className="font-medium w-16">项目名称:</span>
                        <div className="flex items-center flex-1">
                          {isEditingCustomer ? (
                            <input
                              type="text"
                              value={customerInfo.projectName}
                              onChange={(e) => setCustomerInfo(prev => ({ ...prev, projectName: e.target.value }))}
                              className="bg-transparent outline-none flex-1"
                              placeholder="项目名称"
                            />
                          ) : (
                            <span className="flex-1">{customerInfo.projectName}</span>
                          )}
                        </div>
                      </div>

                      {/* 联系人 */}
                      <div className="flex items-center">
                        <span className="w-12">&nbsp;</span>
                        <span className="font-medium w-16">联系人:</span>
                        <div className="flex items-center flex-1">
                          {isEditingCustomer ? (
                            <input
                              type="text"
                              value={customerInfo.contact}
                              onChange={(e) => setCustomerInfo(prev => ({ ...prev, contact: e.target.value }))}
                              className="bg-transparent outline-none flex-1"
                              placeholder="联系人"
                            />
                          ) : (
                            <span className="flex-1">{customerInfo.contact}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右侧：电话、邮箱 */}
                    <div className="flex-1 space-y-1">
                      {/* 电话 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">电话:</span>
                        <div className="flex items-center flex-1">
                          {isEditingCustomer ? (
                            <input
                              type="text"
                              value={customerInfo.phone}
                              onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                              className="bg-transparent outline-none flex-1"
                              placeholder="联系电话"
                            />
                          ) : (
                            <span className="flex-1">{customerInfo.phone}</span>
                          )}
                        </div>
                      </div>

                      {/* 邮箱 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">邮箱:</span>
                        <div className="flex items-center flex-1">
                          {isEditingCustomer ? (
                            <input
                              type="email"
                              value={customerInfo.email}
                              onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                              className="bg-transparent outline-none flex-1"
                              placeholder="邮箱地址"
                            />
                          ) : (
                            <span className="flex-1">{customerInfo.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* From（报价单位）信息 - 左右布局 */}
                  <div className="flex gap-4 mt-3">
                    {/* 左侧：名称、联系人 */}
                    <div className="flex-1 space-y-1">
                      {/* 名称 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">From</span>
                        <span className="font-medium w-16">名称:</span>
                        <span className="flex-1">{template?.companyInfo?.name || '上海内雅美智能科技有限公司'}</span>
                      </div>

                      {/* 联系人 */}
                      <div className="flex items-center">
                        <span className="w-12">&nbsp;</span>
                        <span className="font-medium w-16">联系人:</span>
                        <span className="flex-1">{template?.companyInfo?.contactPerson || 'EVA'}</span>
                      </div>
                    </div>

                    {/* 右侧：电话、邮箱 */}
                    <div className="flex-1 space-y-1">
                      {/* 电话 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">电话:</span>
                        <span className="flex-1">{template?.companyInfo?.phone || '18616748703'}</span>
                      </div>

                      {/* 邮箱 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">邮箱:</span>
                        <span className="flex-1">{template?.companyInfo?.email || 'EVA@RVS-LIGHTING.COM'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 移动端客户信息卡片 */}
              <div className="sm:hidden print:hidden p-3 space-y-3">
                {/* 客户信息卡片 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">To</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">客户信息</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title={isEditingCustomer ? "保存客户信息" : "编辑客户信息"}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* 客户名称 */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">客户名称</label>
                      {isEditingCustomer ? (
                        <input
                          type="text"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2"
                          placeholder="请输入客户名称"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                          {customerInfo.name || '未设置'}
                        </div>
                      )}
                    </div>

                    {/* 项目名称 */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">项目名称</label>
                      {isEditingCustomer ? (
                        <input
                          type="text"
                          value={customerInfo.projectName}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, projectName: e.target.value }))}
                          className="w-full text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2"
                          placeholder="请输入项目名称"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                          {customerInfo.projectName || '未设置'}
                        </div>
                      )}
                    </div>

                    {/* 联系人和电话 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">联系人</label>
                        {isEditingCustomer ? (
                          <input
                            type="text"
                            value={customerInfo.contact}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, contact: e.target.value }))}
                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2"
                            placeholder="联系人"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                            {customerInfo.contact || '未设置'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 block mb-1">电话</label>
                        {isEditingCustomer ? (
                          <input
                            type="text"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2"
                            placeholder="联系电话"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                            {customerInfo.phone || '未设置'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 邮箱 */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">邮箱</label>
                      {isEditingCustomer ? (
                        <input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2"
                          placeholder="邮箱地址"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                          {customerInfo.email || '未设置'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 报价单位信息卡片 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600">From</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">报价单位</span>
                  </div>

                  <div className="space-y-3">
                    {/* 公司名称 */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">公司名称</label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                        {template?.companyInfo?.name || '上海内雅美智能科技有限公司'}
                      </div>
                    </div>

                    {/* 联系人和电话 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">联系人</label>
                        <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                          {template?.companyInfo?.contactPerson || 'EVA'}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 block mb-1">电话</label>
                        <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                          {template?.companyInfo?.phone || '18616748703'}
                        </div>
                      </div>
                    </div>

                    {/* 邮箱 */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">邮箱</label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                        {template?.companyInfo?.email || 'EVA@RVS-LIGHTING.COM'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 打印时显示的客户信息 */}
              <div className="hidden print:block p-4 text-sm customer-info">
                <div className="space-y-2">
                  {/* To（报价对象）信息 - 左右布局 */}
                  <div className="flex gap-4">
                    {/* 左侧：客户名称、项目名称、联系人 */}
                    <div className="flex-1 space-y-1">
                      {/* 客户名称 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">To</span>
                        <span className="font-medium w-16">客户名称:</span>
                        <span className="flex-1">{customerInfo.name}</span>
                      </div>

                      {/* 项目名称 */}
                      <div className="flex items-center">
                        <span className="w-12">&nbsp;</span>
                        <span className="font-medium w-16">项目名称:</span>
                        <span className="flex-1">{customerInfo.projectName}</span>
                      </div>

                      {/* 联系人 */}
                      <div className="flex items-center">
                        <span className="w-12">&nbsp;</span>
                        <span className="font-medium w-16">联系人:</span>
                        <span className="flex-1">{customerInfo.contact}</span>
                      </div>
                    </div>

                    {/* 右侧：电话、邮箱 */}
                    <div className="flex-1 space-y-1">
                      {/* 电话 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">电话:</span>
                        <span className="flex-1">{customerInfo.phone}</span>
                      </div>

                      {/* 邮箱 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">邮箱:</span>
                        <span className="flex-1">{customerInfo.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* From（报价单位）信息 - 左右布局 */}
                  <div className="flex gap-4 mt-3">
                    {/* 左侧：名称、联系人 */}
                    <div className="flex-1 space-y-1">
                      {/* 名称 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">From</span>
                        <span className="font-medium w-16">名称:</span>
                        <span className="flex-1">{template?.companyInfo?.name || '上海内雅美智能科技有限公司'}</span>
                      </div>

                      {/* 联系人 */}
                      <div className="flex items-center">
                        <span className="w-12">&nbsp;</span>
                        <span className="font-medium w-16">联系人:</span>
                        <span className="flex-1">{template?.companyInfo?.contactPerson || 'EVA'}</span>
                      </div>
                    </div>

                    {/* 右侧：电话、邮箱 */}
                    <div className="flex-1 space-y-1">
                      {/* 电话 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">电话:</span>
                        <span className="flex-1">{template?.companyInfo?.phone || '18616748703'}</span>
                      </div>

                      {/* 邮箱 */}
                      <div className="flex items-center">
                        <span className="font-medium w-12">邮箱:</span>
                        <span className="flex-1">{template?.companyInfo?.email || 'EVA@RVS-LIGHTING.COM'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 移动端提示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 sm:hidden print:hidden">
              <div className="text-blue-800 text-xs">
                💡 提示：移动端已优化显示，点击产品卡片可查看详细信息
              </div>
            </div>

            {/* 移动端产品卡片列表 */}
            <div className="sm:hidden print:hidden space-y-4">
              {projectList.map((item, index) => (
                <div key={item.productId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* 产品头部信息 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          #{String(index + 1).padStart(3, '0')}
                        </span>
                        <span className="text-xs text-gray-500">{item.product.brand || 'RVS'}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {projectFields[item.productId]?.model || item.generatedModel || item.product.model || '订货代码'}
                      </div>
                      <div className="text-xs text-gray-600">
                        使用区域: {projectFields[item.productId]?.useArea || '未设置'}
                      </div>
                    </div>

                    {/* 产品图片 */}
                    <div className="ml-3">
                      {item.product.images?.display ? (
                        <img
                          src={item.product.images.display}
                          alt={item.product.model || '产品图片'}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-500">
                          无图
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 技术参数 */}
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">技术参数:</div>
                    <div className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-2 rounded">
                      {projectFields[item.productId]?.specifications || generateEnhancedSpecifications(item) || '暂无参数'}
                    </div>
                  </div>

                  {/* 价格和数量信息 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div>
                        <div className="text-xs text-gray-500">
                          单价 {shouldShowUnitPrice(item) ? `(${getPriceTypeLabel(item)})` : '(手动输入)'}
                        </div>
                        <input
                          type="text"
                          value={(() => {
                            // 优先使用用户正在输入的原始值，避免小数点被截断
                            if (projectFields[item.productId]?.unitPriceInput !== undefined) {
                              return projectFields[item.productId].unitPriceInput
                            }
                            return shouldShowUnitPrice(item) ?
                              (getDisplayPrice(item) > 0 ? getDisplayPrice(item).toString() : '') :
                              (projectFields[item.productId]?.unitPrice ? projectFields[item.productId].unitPrice.toString() : '')
                          })()}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d.]/g, '')
                            // 保存原始输入值用于显示，避免小数点输入时被截断
                            updateProjectField(item.productId, 'unitPriceInput', value)
                            // 同时保存数值用于计算
                            const numValue = parseFloat(value)
                            updateProjectField(item.productId, 'unitPrice', isNaN(numValue) ? 0 : numValue)
                          }}
                          onBlur={() => {
                            // 失去焦点时清理输入状态，使用最终的数值
                            updateProjectField(item.productId, 'unitPriceInput', undefined)
                          }}

                          className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300 outline-none w-20 print:hidden"
                          placeholder={shouldShowUnitPrice(item) ? "单价" : "输入价格"}
                        />
                        <span className="hidden print:inline text-sm font-medium text-gray-900">
                          {shouldShowUnitPrice(item) ?
                            (getDisplayPrice(item) > 0 ? getDisplayPrice(item) : '') :
                            (projectFields[item.productId]?.unitPrice && projectFields[item.productId]?.unitPrice > 0 ? projectFields[item.productId].unitPrice : '')}
                        </span>
                        {!shouldShowUnitPrice(item) && !(projectFields[item.productId]?.unitPrice && projectFields[item.productId]?.unitPrice > 0) && (
                          <div className="text-xs text-gray-400 print:hidden mt-1">请咨询销售</div>
                        )}
                      </div>
                    </div>

                    {/* 数量控制 */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full text-sm flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full text-sm flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* 小计 */}
                    <div className="text-right ml-4">
                      <div className="text-xs text-gray-500">小计</div>
                      {shouldShowUnitPrice(item) || (projectFields[item.productId]?.unitPrice && projectFields[item.productId]?.unitPrice > 0) ? (
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice((projectFields[item.productId]?.unitPrice || getDisplayPrice(item)) * item.quantity)}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">-</div>
                      )}
                    </div>
                  </div>

                  {/* 备注和操作 */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex-1 mr-3">
                      <input
                        type="text"
                        value={projectFields[item.productId]?.remarks || item.product.productremark || item.product.notes || ''}
                        onChange={(e) => updateProjectField(item.productId, 'remarks', e.target.value)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1"
                        placeholder="备注信息"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="删除此项"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* PC端产品表格 */}
            <div className="hidden sm:block print:block overflow-x-auto table-container">
              <table className="w-full border-collapse quotation-table min-w-full" style={{ tableLayout: 'fixed' }}>
                {/* 列宽定义：序号3% 使用区域6% 品牌5% 图片7% 技术参数22% 型号13% 单价9% 数量6% 单位4% 小计10% 备注10% 操作5% */}
                <colgroup>
                  <col style={{ width: '3%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '5%' }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[3%]">序号</th>
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[6%]">
                      <div>使用</div>
                      <div>区域</div>
                    </th>
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[3%]">品牌</th>
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[7%]">图片</th>
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[22%]">技术参数</th>
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[13%]">订货代码</th>
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[9%]">单价</th>
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[6%]">数量</th>
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[4%]">单位</th>
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[10%]">小计</th>
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[6%]">报价备注</th>
                    <th className="border border-gray-300 p-1 text-center text-sm font-medium bg-gray-50 w-[5%] print:hidden">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {projectList.map((item, index) => (
                    <tr key={item.productId} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-1 text-center text-sm">{index + 1}</td>
                      <td className="border border-gray-300 p-1 text-center text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                        <textarea
                          value={projectFields[item.productId]?.useArea || ''}
                          onChange={(e) => updateProjectField(item.productId, 'useArea', e.target.value)}
                          className="w-full bg-white border border-gray-300 outline-none text-center text-sm print:hidden break-words resize-none focus:border-blue-500 focus:bg-white"
                          placeholder="使用区域/灯具编号"
                          rows={2}
                          style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            height: 'auto',
                            minHeight: '2.5em',
                            lineHeight: '1.2',
                            overflow: 'hidden',
                            resize: 'none'
                          }}
                        />
                        <span className="hidden print:inline text-center text-sm break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                          {projectFields[item.productId]?.useArea || ''}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-1 text-center text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{item.product.brand || 'RVS'}</td>
                      <td className="border border-gray-300 p-1 text-center">
                        {item.product.images?.display ? (
                          <img
                            src={item.product.images.display}
                            alt={item.product.model || '产品图片'}
                            className="w-15 h-15 object-cover mx-auto rounded"
                          />
                        ) : (
                          <div className="w-15 h-15 bg-gray-200 mx-auto rounded flex items-center justify-center text-sm text-gray-500">
                            无图
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 p-1 text-sm text-left">
                        <div
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateProjectField(item.productId, 'specifications', e.currentTarget.textContent || '')}
                          className="w-full bg-transparent outline-none text-sm leading-tight whitespace-pre-line min-h-[3rem] print:hidden text-left"
                          style={{ wordWrap: 'break-word' }}
                        >
                          {projectFields[item.productId]?.specifications || generateEnhancedSpecifications(item)}
                        </div>
                        <div className="hidden print:block whitespace-pre-line leading-tight text-sm text-left">
                          {projectFields[item.productId]?.specifications || generateEnhancedSpecifications(item) || '-'}
                        </div>
                      </td>
                      <td className="border border-gray-300 p-1 text-center text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                        <textarea
                          value={projectFields[item.productId]?.model || item.generatedModel || item.product.model || ''}
                          onChange={(e) => updateProjectField(item.productId, 'model', e.target.value)}
                          className="w-full bg-white border border-gray-300 outline-none text-center text-sm print:hidden break-words resize-none focus:border-blue-500 focus:bg-white"
                          placeholder="订货代码"
                          rows={3}
                          style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            height: 'auto',
                            minHeight: '3em',
                            lineHeight: '1.2',
                            overflow: 'hidden',
                            resize: 'none'
                          }}
                        />
                        <span className="hidden print:inline text-sm break-words whitespace-normal leading-tight" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                          {projectFields[item.productId]?.model || item.generatedModel || item.product.model || '-'}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-1 text-center text-sm">
                        <input
                          type="text"
                          value={(() => {
                            // 优先使用用户正在输入的原始值，避免小数点被截断
                            if (projectFields[item.productId]?.unitPriceInput !== undefined) {
                              return projectFields[item.productId].unitPriceInput
                            }
                            // 使用与移动端一致的逻辑
                            if (shouldShowUnitPrice(item)) {
                              // 对于Onoff产品，显示价格
                              const price = getDisplayPrice(item)
                              return price > 0 ? price.toString() : ''
                            } else {
                              // 对于非Onoff产品，只显示用户手动输入的价格
                              return projectFields[item.productId]?.unitPrice ? projectFields[item.productId].unitPrice.toString() : ''
                            }
                          })()}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d.]/g, '')
                            // 保存原始输入值用于显示，避免小数点输入时被截断
                            updateProjectField(item.productId, 'unitPriceInput', value)
                            // 同时保存数值用于计算
                            const numValue = parseFloat(value)
                            updateProjectField(item.productId, 'unitPrice', isNaN(numValue) ? 0 : numValue)
                          }}
                          onBlur={() => {
                            // 失去焦点时清理输入状态，使用最终的数值
                            updateProjectField(item.productId, 'unitPriceInput', undefined)
                          }}

                          className="w-full bg-white border-2 border-blue-300 outline-none text-center text-base font-medium print:hidden px-2 py-1"
                          placeholder={shouldShowUnitPrice(item) ? "单价" : "输入价格"}
                          title={shouldShowUnitPrice(item) ? "当前显示含税经销商价，可以输入调整金额" : "系统无法自动显示此产品价格，请手动输入"}
                        />
                        <span className="hidden print:inline text-center text-sm">
                          {(() => {
                            // 使用与小计计算完全相同的逻辑
                            const finalPrice = projectFields[item.productId]?.unitPrice || getDisplayPrice(item)
                            return finalPrice > 0 ? finalPrice : ''
                          })()}
                        </span>
                        <div className="text-xs text-gray-500 mt-0.5 print:hidden">
                          {shouldShowUnitPrice(item) ? getPriceTypeLabel(item) : '手动输入'}
                        </div>
                        {!shouldShowUnitPrice(item) && !(projectFields[item.productId]?.unitPrice && projectFields[item.productId]?.unitPrice > 0) && (
                          <div className="text-xs text-gray-400 text-center leading-tight print:hidden mt-1">
                            <div className="text-[10px]">
                              系统只显示Onoff产品价格，调光产品价格请咨询销售人员
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        <div className="flex items-center justify-center space-x-1 print:hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded text-sm flex items-center justify-center print:!hidden"
                            title="减少数量"
                          >
                            <Minus className="w-2 h-2" />
                          </button>
                          <input
                            type="text"
                            value={item.quantity.toString()}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '')
                              if (value === '' || parseInt(value) > 0) {
                                updateQuantity(item.productId, parseInt(value) || 1)
                              }
                            }}
                            className="w-12 text-center text-base font-medium bg-white border-2 border-blue-300 outline-none print:!hidden px-1 py-1"
                            title="点击+/-或直接输入数量"
                            placeholder="1"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded text-sm flex items-center justify-center print:!hidden"
                            title="增加数量"
                          >
                            <Plus className="w-2 h-2" />
                          </button>
                        </div>
                        <span className="print:inline hidden text-sm">{item.quantity}</span>
                      </td>
                      <td className="border border-gray-300 p-1 text-center text-sm">PCS</td>
                      <td className="border border-gray-300 p-1 text-center text-sm font-medium">
                        {(shouldShowUnitPrice(item) && getDisplayPrice(item) > 0) || (projectFields[item.productId]?.unitPrice && projectFields[item.productId]?.unitPrice > 0) ? (
                          <span className="price-auto-scale">
                            {formatPrice((projectFields[item.productId]?.unitPrice || getDisplayPrice(item)) * item.quantity)}
                          </span>
                        ) : (
                          <div className="text-xs text-gray-400 text-center">
                            -
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 p-1 text-center text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                        <textarea
                          value={projectFields[item.productId]?.remarks || item.product.productremark || item.product.notes || ''}
                          onChange={(e) => updateProjectField(item.productId, 'remarks', e.target.value)}
                          className="w-full bg-white border border-gray-300 outline-none text-center text-sm print:hidden break-words resize-none focus:border-blue-500 focus:bg-white"
                          placeholder="可输入其他备注信息"
                          rows={2}
                          style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            height: 'auto',
                            minHeight: '2.5em',
                            lineHeight: '1.2',
                            overflow: 'hidden',
                            resize: 'none'
                          }}
                        />
                        <span className="hidden print:inline text-center text-sm break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                          {projectFields[item.productId]?.remarks || item.product.productremark || item.product.notes || ''}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-1 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="text-red-600 hover:text-red-800 p-1"
                          style={{ color: '#dc2626' }}
                          title="删除此项"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: 'inherit' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 报价单总计 */}
            <div className="px-6 pb-6 total-section">
              <div className="overflow-x-auto">
                <table className="w-full total-summary-table">
                  <tbody>
                    <tr>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td className="text-right pr-1">
                        <span className="text-sm total-label">合计金额:</span>
                      </td>
                      <td className="text-left pl-1">
                        <span className="text-sm">{formatPrice(calculateTotal())}</span>
                      </td>
                      <td>&nbsp;</td>
                      <td className="print:hidden">&nbsp;</td>
                    </tr>
                    {finalAmount > 0 && (
                      <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td className="text-right pr-1">
                          <span className="text-sm total-label">优惠金额:</span>
                        </td>
                        <td className="text-left pl-1">
                          <span className="text-sm">{formatPrice(finalAmount)}</span>
                        </td>
                        <td>&nbsp;</td>
                        <td className="print:hidden">&nbsp;</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 优惠金额输入区域 - 只在非打印时显示 */}
              <div className="mt-4 print:hidden">
                <div className="flex items-center justify-end space-x-2">
                  <label className="text-sm text-gray-600">优惠金额:</label>
                  {isEditingFinalAmount ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={finalAmount}
                        onChange={(e) => setFinalAmount(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="0.00"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingFinalAmount(false)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        确定
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFinalAmount(0)
                          setIsEditingFinalAmount(false)
                        }}
                        className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        清除
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {finalAmount > 0 ? formatPrice(finalAmount) : '¥0.00'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingFinalAmount(true)}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                      >
                        {finalAmount > 0 ? '修改' : '设置'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 报价单结尾 */}
              <div className="text-sm text-gray-700 space-y-2 quotation-notes">
                <div className="flex items-center">
                  <span className="font-medium">报价说明:</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 rounded-md border border-blue-300 print:hidden transition-colors"
                    style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' }}
                    title={isEditingNotes ? "保存报价说明" : "编辑报价说明"}
                  >
                    <Edit className="w-4 h-4" style={{ color: 'inherit' }} />
                  </button>
                </div>
                {isEditingNotes ? (
                  <textarea
                    value={quotationNotes}
                    onChange={(e) => setQuotationNotes(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm resize-none print:hidden"
                    rows={4}
                    placeholder="请输入报价说明"
                  />
                ) : (
                  <div className="whitespace-pre-line">
                    {quotationNotes.split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </div>
                )}
                <div className="text-right mt-6">
                  <span className="font-medium">{template?.companyInfo?.name || '上海内雅美智能科技有限公司'}</span>
                </div>
              </div>
            </div>
          </div>
          </>
        )}
      </main>

      {/* 模板设置模态框 */}
      {showTemplateEditor && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* 背景遮罩 */}
            <div
              className="fixed inset-0 backdrop-blur-sm bg-white/30 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowTemplateEditor(false)}
            ></div>

            {/* 垂直居中辅助元素 */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* 模态框内容 */}
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full mx-4">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    报价模板设置
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTemplateEditor(false)}
                    className="rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 transition-colors"
                    title="关闭"
                  >
                    <span className="sr-only">关闭</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                  <CompanyInfoEditor
                    onSave={() => {
                      loadTemplate()
                      setShowTemplateEditor(false)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 导入暂存对话框 */}
      {showImportDialog && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* 背景遮罩 */}
            <div
              className="fixed inset-0 backdrop-blur-sm bg-white/30 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowImportDialog(false)}
            ></div>

            {/* 垂直居中辅助元素 */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* 模态框内容 */}
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full mx-4">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    导入暂存的项目清单 ({savedProjects.length}/5)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowImportDialog(false)}
                    className="rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 transition-colors"
                    title="关闭"
                  >
                    <span className="sr-only">关闭</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                  {isLoadingSaves ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600">&nbsp;</div>
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : savedProjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>暂无保存的项目清单</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedProjects.map((save) => (
                        <div key={save._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{save.name}</h4>
                              <div className="text-sm text-gray-500 mt-1">
                                <p>客户：{save.customerInfo?.name || '未设置'}</p>
                                <p>项目：{save.customerInfo?.projectName || '未设置'}</p>
                                <p>产品数量：{save.projectList?.length || 0} 项</p>
                                <p>保存时间：{new Date(save.updatedAt).toLocaleString('zh-CN')}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                type="button"
                                onClick={() => handleImport(save._id)}
                                className="inline-flex items-center px-3 py-1 border border-green-300 rounded text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                导入
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSave(save._id)}
                                className="inline-flex items-center px-3 py-1 border border-red-300 rounded text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                style={{ backgroundColor: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }}
                              >
                                <Trash2 className="w-4 h-4 mr-1" style={{ color: 'inherit' }} />
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
  )
}
