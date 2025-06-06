/**
 * 从备份恢复列配置
 * 
 * 使用方法：
 * node scripts/restore-from-backup.js [backup-file-path]
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

function findLatestBackup() {
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    console.error('备份目录不存在');
    return null;
  }
  
  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('columns-backup-') && file.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.error('没有找到备份文件');
    return null;
  }
  
  return path.join(backupDir, files[0]);
}

async function restoreFromBackup(backupFilePath) {
  let client;
  
  try {
    // 确定备份文件路径
    let backupFile = backupFilePath;
    if (!backupFile) {
      backupFile = findLatestBackup();
      if (!backupFile) {
        console.error('无法找到备份文件');
        return;
      }
      console.log(`使用最新备份文件: ${backupFile}`);
    }
    
    // 检查备份文件是否存在
    if (!fs.existsSync(backupFile)) {
      console.error(`备份文件不存在: ${backupFile}`);
      return;
    }
    
    // 读取备份数据
    console.log('正在读取备份文件...');
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`备份文件包含 ${backupData.length} 个列配置`);
    
    client = await connectToMongoDB();
    
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('columnConfigs');
    
    console.log('开始恢复列配置...');
    
    // 备份当前配置
    const currentColumns = await collection.find({}).toArray();
    console.log(`当前数据库中有 ${currentColumns.length} 个列配置`);
    
    // 清空现有配置
    await collection.deleteMany({});
    console.log('已清空现有列配置');
    
    // 准备恢复数据（移除_id字段）
    const columnsToRestore = backupData.map(col => {
      const { _id, ...columnWithoutId } = col;
      return columnWithoutId;
    });
    
    // 恢复备份数据
    const result = await collection.insertMany(columnsToRestore);
    console.log(`成功恢复 ${result.insertedCount} 个列配置`);
    
    // 验证恢复结果
    const restoredColumns = await collection.find({}).sort({ order: 1 }).toArray();
    console.log(`验证：数据库中现在有 ${restoredColumns.length} 个列配置`);
    
    // 显示恢复的列配置摘要
    console.log('\n恢复的列配置摘要:');
    console.log(`- 总列数: ${restoredColumns.length}`);
    console.log(`- 可见列: ${restoredColumns.filter(col => col.isVisible).length}`);
    console.log(`- 隐藏列: ${restoredColumns.filter(col => !col.isVisible).length}`);
    
    // 显示隐藏列
    const hiddenColumns = restoredColumns.filter(col => !col.isVisible);
    if (hiddenColumns.length > 0) {
      console.log('\n隐藏列列表:');
      hiddenColumns.forEach((col, index) => {
        console.log(`${index + 1}. ${col.key} (${col.label})`);
      });
    }
    
  } catch (error) {
    console.error('恢复列配置失败:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('数据库连接已关闭');
    }
  }
}

// 获取命令行参数
const backupFilePath = process.argv[2];

// 执行恢复
restoreFromBackup(backupFilePath);
