/**
 * 数据迁移脚本：将xxbws项目的产品数据迁移到xxbaug项目
 *
 * 使用方法：
 * node scripts/migrate-xxbws-data.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// 连接MongoDB
async function connectToMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('未找到MongoDB连接URI，请确保.env.local文件中包含MONGODB_URI');
      process.exit(1);
    }
    
    console.log('正在连接到MongoDB...');
    await mongoose.connect(uri);
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

// xxbws产品数据模型（原始格式）
const LegacyProductSchema = new mongoose.Schema({
  productData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  }
}, { timestamps: true });

// xxbaug产品数据模型（新格式）
const FileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  cosStoragePath: { type: String },
  filename: { type: String },
  size: { type: Number },
  mimeType: { type: String }
}, { _id: false });

const NewProductSchema = new mongoose.Schema({
  productType: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProductType'
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  tags: { 
    type: Object,
    default: {}
  },
  specification: { 
    type: String,
    trim: true 
  },
  displayImage: { 
    type: FileSchema
  },
  introImages: [FileSchema],
  specFiles: [FileSchema],
  cadFiles: [FileSchema],
  iesFiles: [FileSchema],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// 创建模型
const LegacyProduct = mongoose.model('LegacyProduct', LegacyProductSchema, 'products');
const NewProduct = mongoose.model('NewProduct', NewProductSchema, 'products_new');

// 数据转换函数
function convertLegacyProduct(legacyProduct) {
  const data = legacyProduct.productData;
  
  // 将Map转换为普通对象
  const productData = data instanceof Map ? Object.fromEntries(data) : data;
  
  console.log('转换产品数据:', Object.keys(productData));
  
  return {
    name: productData['产品名称'] || productData['name'] || '未命名产品',
    description: productData['产品描述'] || productData['description'] || '',
    specification: productData['详细规格'] || productData['specification'] || '',
    
    // 处理图片
    displayImage: productData['产品图片'] || productData['displayImage'] ? {
      url: productData['产品图片'] || productData['displayImage'] || '',
      cosStoragePath: '',
      filename: '',
      size: 0,
      mimeType: 'image/jpeg'
    } : {
      url: '',
      cosStoragePath: '',
      filename: '',
      size: 0,
      mimeType: 'image/jpeg'
    },
    
    // 空的文件数组
    introImages: [],
    specFiles: [],
    cadFiles: [],
    iesFiles: [],
    
    // 标签（空对象）
    tags: {},
    
    // 状态
    isActive: true,
    isFeatured: false,
    order: 999,
    
    // 保留原始时间戳
    createdAt: legacyProduct.createdAt || new Date(),
    updatedAt: legacyProduct.updatedAt || new Date()
  };
}

// 主迁移函数
async function migrateData() {
  try {
    console.log('开始数据迁移...');
    
    // 获取所有legacy产品
    const legacyProducts = await LegacyProduct.find({});
    console.log(`找到 ${legacyProducts.length} 个legacy产品`);
    
    if (legacyProducts.length === 0) {
      console.log('没有找到需要迁移的数据');
      return;
    }
    
    // 清空新产品集合（可选）
    console.log('清空现有的新产品数据...');
    await NewProduct.deleteMany({});
    
    // 转换并插入数据
    const convertedProducts = [];
    
    for (const legacyProduct of legacyProducts) {
      try {
        const converted = convertLegacyProduct(legacyProduct);
        convertedProducts.push(converted);
      } catch (error) {
        console.error(`转换产品失败 (ID: ${legacyProduct._id}):`, error);
      }
    }
    
    if (convertedProducts.length > 0) {
      console.log(`插入 ${convertedProducts.length} 个转换后的产品...`);
      await NewProduct.insertMany(convertedProducts);
      console.log('数据迁移完成！');
    } else {
      console.log('没有成功转换的产品数据');
    }
    
    // 显示迁移结果
    const newCount = await NewProduct.countDocuments();
    console.log(`迁移结果: ${newCount} 个产品已成功迁移`);
    
  } catch (error) {
    console.error('数据迁移失败:', error);
  }
}

// 执行迁移
async function main() {
  await connectToMongoDB();
  await migrateData();
  await mongoose.connection.close();
  console.log('迁移脚本执行完成');
}

main().catch(console.error);
