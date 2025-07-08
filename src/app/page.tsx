import { redirect } from 'next/navigation'

export default function Home() {
  // 重定向到产品选型表 V3 页面
  redirect('/product-list-v3')
}
