// 测试添加产品功能的脚本
const testProduct = {
  productType: '筒灯',
  brand: 'RVS',
  model: 'TEST-NEW-001',
  images: {
    display: 'https://example.com/test-image.jpg',
    dimension: '',
    accessories: ''
  },
  specifications: {
    detailed: '这是一个测试产品的详细规格参数\n支持多行显示\n第三行内容',
    brief: '测试产品简要规格'
  },
  appearance: {
    color: '白色',
    installation: '嵌入式',
    cutoutSize: '100mm'
  },
  control: '开关控制',
  notes: '这是测试备注',
  pricing: {
    unitPrice: 299,
    deliveryTime: '3-5个工作日'
  },
  isActive: true,
  isNew: true,
  order: 1
}

console.log('测试产品数据:', JSON.stringify(testProduct, null, 2))

// 可以在浏览器控制台中运行以下代码来测试添加产品：
/*
fetch('/api/admin/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testProduct),
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log('添加产品结果:', data))
.catch(error => console.error('添加产品错误:', error))
*/
