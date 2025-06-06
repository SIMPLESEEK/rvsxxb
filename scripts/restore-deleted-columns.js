/**
 * 恢复被删除的15个自定义列配置
 * 
 * 使用方法：
 * node scripts/restore-deleted-columns.js
 */

const { MongoClient } = require('mongodb');

// 手动设置环境变量
process.env.MONGODB_URI = 'mongodb+srv://litegpt010:mCjCc5siRXLD0I50@light.hrsxzae.mongodb.net/xxb?retryWrites=true&w=majority';
process.env.MONGODB_DB = 'xxb';

// 被删除的15个列配置
const deletedColumns = [
  {
    key: 'vendorBody1',
    label: '灯体供应商1',
    type: 'text',
    roles: ['admin'],
    width: '5%',
    bg: '#f8f9fa',
    order: 16,
    isVisible: false
  },
  {
    key: 'vendorBody2',
    label: '灯体供应商2',
    type: 'text',
    roles: ['admin'],
    width: '5%',
    bg: '#f8f9fa',
    order: 17,
    isVisible: false
  },
  {
    key: 'costBody1',
    label: '灯体成本1',
    type: 'number',
    roles: ['admin'],
    width: '4%',
    bg: '#f8f9fa',
    order: 18,
    isVisible: false
  },
  {
    key: 'costBody2',
    label: '灯体成本2',
    type: 'number',
    roles: ['admin'],
    width: '4%',
    bg: '#f8f9fa',
    order: 19,
    isVisible: false
  },
  {
    key: 'vendorLED',
    label: 'LED供应商',
    type: 'text',
    roles: ['admin'],
    width: '5%',
    bg: '#f8f9fa',
    order: 20,
    isVisible: false
  },
  {
    key: 'costLED',
    label: 'LED成本',
    type: 'number',
    roles: ['admin'],
    width: '4%',
    bg: '#f8f9fa',
    order: 21,
    isVisible: false
  },
  {
    key: 'vendorDriver',
    label: '驱动供应商',
    type: 'text',
    roles: ['admin'],
    width: '5%',
    bg: '#f8f9fa',
    order: 22,
    isVisible: false
  },
  {
    key: 'costDriver',
    label: '驱动成本',
    type: 'number',
    roles: ['admin'],
    width: '4%',
    bg: '#f8f9fa',
    order: 23,
    isVisible: false
  },
  {
    key: 'vendorLens',
    label: '透镜供应商',
    type: 'text',
    roles: ['admin'],
    width: '5%',
    bg: '#f8f9fa',
    order: 24,
    isVisible: false
  },
  {
    key: 'costLens',
    label: '透镜成本',
    type: 'number',
    roles: ['admin'],
    width: '4%',
    bg: '#f8f9fa',
    order: 25,
    isVisible: false
  },
  {
    key: 'vendorAccessory',
    label: '配件供应商',
    type: 'text',
    roles: ['admin'],
    width: '5%',
    bg: '#f8f9fa',
    order: 26,
    isVisible: false
  },
  {
    key: 'costAccessory',
    label: '配件成本',
    type: 'number',
    roles: ['admin'],
    width: '4%',
    bg: '#f8f9fa',
    order: 27,
    isVisible: false
  },
  {
    key: 'totalCost',
    label: '总成本',
    type: 'number',
    roles: ['admin'],
    width: '4%',
    bg: '#fff2cc',
    order: 28,
    isVisible: false
  },
  {
    key: 'profitMargin',
    label: '利润率',
    type: 'number',
    roles: ['admin'],
    width: '4%',
    bg: '#fff2cc',
    order: 29,
    isVisible: false
  },
  {
    key: 'internalNotes',
    label: '内部备注',
    type: 'multiline',
    roles: ['admin'],
    width: '6%',
    bg: '#f8f9fa',
    order: 30,
    isVisible: false
  }
];

async function connectToMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;

    console.log('环境变量检查:');
    console.log('MONGODB_URI:', uri ? '已设置' : '未设置');
    console.log('MONGODB_DB:', process.env.MONGODB_DB);

    if (!uri) {
      console.error('未找到MongoDB连接URI，请确保.env.local文件中包含MONGODB_URI');
      process.exit(1);
    }

    console.log('正在连接到MongoDB...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('MongoDB连接成功');
    return client;
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    console.error('错误详情:', error.message);
    process.exit(1);
  }
}

async function restoreDeletedColumns() {
  let client;
  
  try {
    client = await connectToMongoDB();
    
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('columnConfigs');
    
    console.log('开始恢复被删除的列配置...');
    
    // 检查当前列配置数量
    const currentCount = await collection.countDocuments();
    console.log(`当前数据库中有 ${currentCount} 个列配置`);
    
    // 检查哪些列已经存在
    const existingColumns = await collection.find({}).toArray();
    const existingKeys = existingColumns.map(col => col.key);
    
    console.log('现有列配置:', existingKeys);
    
    // 过滤出需要恢复的列
    const columnsToRestore = deletedColumns.filter(col => !existingKeys.includes(col.key));
    
    if (columnsToRestore.length === 0) {
      console.log('所有列配置都已存在，无需恢复');
      return;
    }
    
    console.log(`需要恢复 ${columnsToRestore.length} 个列配置:`);
    columnsToRestore.forEach(col => {
      console.log(`- ${col.key}: ${col.label}`);
    });
    
    // 插入缺失的列配置
    const result = await collection.insertMany(columnsToRestore);
    console.log(`成功恢复 ${result.insertedCount} 个列配置`);
    
    // 验证恢复结果
    const finalCount = await collection.countDocuments();
    console.log(`恢复后数据库中共有 ${finalCount} 个列配置`);
    
    // 显示所有列配置
    const allColumns = await collection.find({}).sort({ order: 1 }).toArray();
    console.log('\n所有列配置:');
    allColumns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.key} (${col.label}) - 可见: ${col.isVisible}, 顺序: ${col.order}`);
    });
    
  } catch (error) {
    console.error('恢复列配置失败:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行恢复
restoreDeletedColumns();
