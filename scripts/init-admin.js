#!/usr/bin/env node

/**
 * 初始化管理员账户脚本
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function initAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('请设置 MONGODB_URI 环境变量');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('xxb');
    const users = db.collection('users');

    // 检查是否已存在管理员
    const existingAdmin = await users.findOne({ username: 'rvsadmin' });
    if (existingAdmin) {
      console.log('管理员账户已存在');
      return;
    }

    // 创建管理员账户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await users.insertOne({
      username: 'rvsadmin',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date()
    });

    console.log('管理员账户创建成功');
    console.log('用户名: rvsadmin');
    console.log('密码: admin123');

  } catch (error) {
    console.error('创建管理员账户失败:', error);
  } finally {
    await client.close();
  }
}

initAdmin();
