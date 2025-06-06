'use client'

import React from 'react'
import { ProductTable } from '@/components/dashboard/ProductTable'

export default function TestTablePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">产品表格测试页面</h1>
      <div className="bg-white rounded-lg shadow-sm">
        <ProductTable userRole="admin" />
      </div>
    </div>
  )
}
