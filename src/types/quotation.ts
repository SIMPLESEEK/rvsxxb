export interface QuotationTemplate {
  _id?: string
  id?: string
  userId: string

  // 公司信息（主要差异点）
  companyInfo: {
    name: string // 报价公司
    brandName?: string // 报价品牌
    logo?: string // 图片URL
    address?: string
    phone?: string
    email?: string
    contactPerson?: string
  }

  // 报价说明模板
  quotationNotes?: string

  // 时间戳
  createdAt: Date
  updatedAt: Date
}

// 角色默认公司信息
export const ROLE_DEFAULT_COMPANY_INFO: Record<string, Partial<QuotationTemplate['companyInfo']>> = {
  admin: {
    name: '上海内雅美智能科技有限公司',
    brandName: 'RVS Lighting',
    phone: '18616748703',
    email: 'EVA@RVS-LIGHTING.COM',
    contactPerson: 'EVA',
    address: '上海市'
  },
  dealer: {
    name: '请设置您的公司名称',
    brandName: 'RVS Lighting',
    phone: '',
    email: '',
    contactPerson: '',
    address: ''
  },
  user: {
    name: '请设置您的公司名称',
    brandName: 'RVS Lighting',
    phone: '',
    email: '',
    contactPerson: '',
    address: ''
  }
}
