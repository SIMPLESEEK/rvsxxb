/**
 * 列配置备份脚本
 * 
 * 使用方法：
 * node scripts/backup-columns.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// 手动设置环境变量
process.env.MONGODB_URI = 'mongodb+srv://litegpt010:mCjCc5siRXLD0I50@light.hrsxzae.mongodb.net/xxb?retryWrites=true&w=majority';
process.env.MONGODB_DB = 'xxb';

async function connectToMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('未找到MongoDB连接URI');
      process.exit(1);
    }
    
    console.log('正在连接到MongoDB...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('MongoDB连接成功');
    return client;
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

async function backupColumns() {
  let client;
  
  try {
    client = await connectToMongoDB();
    
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('columnConfigs');
    
    console.log('开始备份列配置...');
    
    // 获取所有列配置
    const columns = await collection.find({}).sort({ order: 1 }).toArray();
    console.log(`找到 ${columns.length} 个列配置`);
    
    // 创建备份目录
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 生成备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `columns-backup-${timestamp}.json`);
    
    // 保存备份
    fs.writeFileSync(backupFile, JSON.stringify(columns, null, 2));
    console.log(`备份已保存到: ${backupFile}`);
    
    // 显示备份内容摘要
    console.log('\n备份内容摘要:');
    console.log(`- 总列数: ${columns.length}`);
    console.log(`- 可见列: ${columns.filter(col => col.isVisible).length}`);
    console.log(`- 隐藏列: ${columns.filter(col => !col.isVisible).length}`);
    
    // 显示隐藏列（重要的自定义列）
    const hiddenColumns = columns.filter(col => !col.isVisible);
    if (hiddenColumns.length > 0) {
      console.log('\n隐藏列列表（重要的自定义列）:');
      hiddenColumns.forEach((col, index) => {
        console.log(`${index + 1}. ${col.key} (${col.label})`);
      });
    }
    
  } catch (error) {
    console.error('备份列配置失败:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行备份
backupColumns();
