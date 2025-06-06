import { NextRequest, NextResponse } from 'next/server'
import { ProductModel } from '@/lib/models/Product'

export async function POST(request: NextRequest) {
  try {
    console.log('创建示例产品数据API被调用')
    
    // 参考xxbws的产品数据结构创建示例产品
    const sampleProducts = [
      {
        productType: '嵌入式射灯',
        brand: 'RVS',
        name: '方形嵌入式射灯',
        model: 'RVS-DL-001',
        images: {
          display: '/sample-images/downlight-square.jpg',
          dimension: '/sample-images/downlight-square-dim.jpg',
          accessories: '/sample-images/downlight-square-acc.jpg'
        },
        specifications: {
          detailed: `功率: 8W
光效率: 24°
色温: 3000K
显色指数: >90
输入电压: AC220V
防护等级: IP20
调光方式: ON/OFF
外壳材质: 铝合金
反射器: 高纯度铝反射器
LED芯片: 进口COB芯片
驱动电源: 恒流驱动
使用寿命: >50000小时`,
          brief: '8W方形嵌入式射灯，24°光束角，3000K暖白光'
        },
        appearance: {
          color: '银色合金',
          installation: '嵌入式',
          cutoutSize: '75mm'
        },
        control: 'ON/OFF',
        notes: '12W-3000K-24°-IP20-DC36V',
        pricing: {
          unitPrice: 40.00,
          deliveryTime: '5天'
        },
        isActive: true,
        isFeatured: true,
        order: 1
      },
      {
        productType: '轨道灯',
        brand: 'RVS',
        name: 'COB轨道射灯',
        model: 'RVS-TL-002',
        images: {
          display: '/sample-images/track-light.jpg',
          dimension: '/sample-images/track-light-dim.jpg',
          accessories: '/sample-images/track-light-acc.jpg'
        },
        specifications: {
          detailed: '功率: 8W 光效率: 24° 色温: 3000K 显色指数: >90 输入电压: AC220V 防护等级: IP20 调光方式: ON/OFF',
          brief: '8W COB轨道射灯，高显色指数，适合展示照明'
        },
        appearance: {
          color: '白色',
          installation: '轨道安装',
          cutoutSize: '不适用'
        },
        control: 'ON/OFF',
        notes: '666',
        pricing: {
          unitPrice: 85.00,
          deliveryTime: '3天'
        },
        isActive: true,
        isFeatured: false,
        order: 2
      },
      {
        productType: '面板灯',
        brand: 'RVS',
        name: 'LED面板灯',
        model: 'RVS-PL-003',
        images: {
          display: '/sample-images/panel-light.jpg',
          dimension: '/sample-images/panel-light-dim.jpg',
          accessories: '/sample-images/panel-light-acc.jpg'
        },
        specifications: {
          detailed: '功率: 36W 光效率: 120° 色温: 4000K 显色指数: >80 输入电压: AC220V 防护等级: IP40 调光方式: 调光',
          brief: '36W LED面板灯，均匀光照，办公照明首选'
        },
        appearance: {
          color: '白色',
          installation: '嵌入式/吸顶式',
          cutoutSize: '595x595mm'
        },
        control: '调光',
        notes: '77666',
        pricing: {
          unitPrice: 120.00,
          deliveryTime: '7天'
        },
        isActive: true,
        isFeatured: true,
        order: 3
      },
      {
        productType: '筒灯',
        brand: 'RVS',
        name: '深防眩筒灯',
        model: 'RVS-DL-004',
        images: {
          display: '/sample-images/deep-downlight.jpg',
          dimension: '/sample-images/deep-downlight-dim.jpg',
          accessories: '/sample-images/deep-downlight-acc.jpg'
        },
        specifications: {
          detailed: '功率: 8W 光效率: 24° 色温: 3000K 显色指数: >90 输入电压: AC220V 防护等级: IP20 调光方式: ON/OFF',
          brief: '8W深防眩筒灯，有效减少眩光，提升舒适度'
        },
        appearance: {
          color: '黑色',
          installation: '嵌入式',
          cutoutSize: '90mm'
        },
        control: 'ON/OFF',
        notes: '333',
        pricing: {
          unitPrice: 95.00,
          deliveryTime: '5天'
        },
        isActive: true,
        isFeatured: false,
        order: 4
      },
      {
        productType: '线性灯',
        brand: 'RVS',
        name: 'LED线性灯',
        model: 'RVS-LL-005',
        images: {
          display: '/sample-images/linear-light.jpg',
          dimension: '/sample-images/linear-light-dim.jpg',
          accessories: '/sample-images/linear-light-acc.jpg'
        },
        specifications: {
          detailed: '功率: 24W 光效率: 120° 色温: 4000K 显色指数: >85 输入电压: AC220V 防护等级: IP40 调光方式: 调光',
          brief: '24W LED线性灯，连续光带效果，现代简约设计'
        },
        appearance: {
          color: '银色',
          installation: '嵌入式/悬挂式',
          cutoutSize: '1200x50mm'
        },
        control: '调光',
        notes: '444',
        pricing: {
          unitPrice: 180.00,
          deliveryTime: '10天'
        },
        isActive: true,
        isFeatured: true,
        order: 5
      },
      {
        productType: '投光灯',
        brand: 'RVS',
        name: 'LED投光灯',
        model: 'RVS-FL-006',
        images: {
          display: '/sample-images/flood-light.jpg',
          dimension: '/sample-images/flood-light-dim.jpg',
          accessories: '/sample-images/flood-light-acc.jpg'
        },
        specifications: {
          detailed: `功率: 50W
光效率: 60°
色温: 5000K
显色指数: >70
输入电压: AC220V
防护等级: IP65
调光方式: ON/OFF
材质: 压铸铝合金外壳
散热: 高效散热片设计
透镜: 钢化玻璃透镜
安装: 支架可调角度
适用场所: 户外建筑照明、广场照明、景观照明`,
          brief: '50W LED投光灯，高亮度，适合户外照明'
        },
        appearance: {
          color: '黑色',
          installation: '支架安装',
          cutoutSize: '不适用'
        },
        control: 'ON/OFF',
        notes: '户外防水，适合建筑照明',
        pricing: {
          unitPrice: 280.00,
          deliveryTime: '7天'
        },
        isActive: true,
        isFeatured: false,
        order: 6
      }
    ]

    const createdProducts = []
    
    // 先清空现有产品（可选）
    // await ProductModel.deleteAll()

    for (const productData of sampleProducts) {
      try {
        const product = await ProductModel.create(productData)
        createdProducts.push({
          _id: product._id,
          name: product.name,
          model: product.model,
          productType: product.productType
        })
      } catch (error) {
        console.log(`创建产品 ${productData.name} 时出错:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: '示例产品创建完成',
      count: createdProducts.length,
      products: createdProducts
    })
    
  } catch (error) {
    console.error('创建示例产品失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '创建示例产品失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
