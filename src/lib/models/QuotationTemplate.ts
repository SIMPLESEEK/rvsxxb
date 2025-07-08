import clientPromise from '../mongodb'
import { QuotationTemplate, ROLE_DEFAULT_COMPANY_INFO } from '@/types/quotation'
import { ObjectId } from 'mongodb'

export class QuotationTemplateModel {
  private static async getCollection() {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    return db.collection<QuotationTemplate>('quotationTemplates')
  }

  // 获取用户的模板（每个用户只有一个）
  static async findByUserId(userId: string): Promise<QuotationTemplate | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ userId })
  }

  // 创建或更新用户模板（每个用户只有一个）
  static async createOrUpdate(userId: string, companyInfo: QuotationTemplate['companyInfo'], quotationNotes?: string): Promise<QuotationTemplate> {
    const collection = await this.getCollection()

    const existingTemplate = await this.findByUserId(userId)

    const updateData: any = {
      companyInfo,
      updatedAt: new Date()
    }

    if (quotationNotes !== undefined) {
      updateData.quotationNotes = quotationNotes
    }

    if (existingTemplate) {
      // 更新现有模板
      await collection.updateOne(
        { userId },
        { $set: updateData }
      )
      return { ...existingTemplate, ...updateData }
    } else {
      // 创建新模板
      const template: Omit<QuotationTemplate, '_id'> = {
        userId,
        companyInfo,
        quotationNotes,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await collection.insertOne(template)
      return { ...template, _id: result.insertedId.toString() }
    }
  }

  // 获取或创建用户的模板
  static async getOrCreateTemplate(userId: string, userRole: string): Promise<QuotationTemplate> {
    let template = await this.findByUserId(userId)

    if (!template) {
      // 根据角色创建默认模板
      const defaultCompanyInfo = ROLE_DEFAULT_COMPANY_INFO[userRole] || ROLE_DEFAULT_COMPANY_INFO.user
      template = await this.createOrUpdate(userId, defaultCompanyInfo)
    }

    return template
  }


}
