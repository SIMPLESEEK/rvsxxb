// 初始化用户账户脚本
const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const MONGODB_URI = 'mongodb+srv://litegpt010:mCjCc5siRXLD0I50@light.hrsxzae.mongodb.net/xxb?retryWrites=true&w=majority'

async function initUsers() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log('🔗 连接到MongoDB成功')

    const db = client.db('xxb')
    const users = db.collection('users')

    // 定义要创建的用户
    const usersToCreate = [
      {
        username: 'rvsadmin',
        email: 'admin@rvslighting.com',
        password: 'rvs2024',
        role: 'admin'
      },
      {
        username: 'julin',
        email: 'julin@rvslighting.com',
        password: 'julin123',
        role: 'dealer'
      },
      {
        username: 'liu',
        email: 'liu@rvslighting.com',
        password: '20240723',
        role: 'user'
      }
    ]

    console.log('📝 开始创建用户账户...\n')

    for (const userData of usersToCreate) {
      // 检查用户是否已存在
      const existingUser = await users.findOne({ username: userData.username })
      if (existingUser) {
        console.log(`⚠️  用户 ${userData.username} 已存在，跳过创建`)
        continue
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // 创建用户对象
      const user = {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 插入用户
      const result = await users.insertOne(user)

      console.log(`✅ ${userData.role === 'admin' ? '管理员' : userData.role === 'dealer' ? '经销商' : '用户'}账户创建成功!`)
      console.log(`   用户名: ${userData.username}`)
      console.log(`   密码: ${userData.password}`)
      console.log(`   邮箱: ${userData.email}`)
      console.log(`   角色: ${userData.role}`)
      console.log(`   ID: ${result.insertedId}\n`)
    }

    console.log('🎉 所有用户账户创建完成!')
    console.log('\n📋 登录信息汇总:')
    console.log('==========================================')
    console.log('管理员账户:')
    console.log('  用户名: rvsadmin')
    console.log('  密码: rvs2024')
    console.log('  权限: 完整管理权限')
    console.log('')
    console.log('经销商账户:')
    console.log('  用户名: julin')
    console.log('  密码: julin123')
    console.log('  权限: 查看产品+价格+交货时间')
    console.log('')
    console.log('普通用户账户:')
    console.log('  用户名: liu')
    console.log('  密码: 20240723')
    console.log('  权限: 查看基本产品信息')
    console.log('==========================================')

  } catch (error) {
    console.error('❌ 创建用户账户失败:', error)
  } finally {
    await client.close()
    console.log('🔌 数据库连接已关闭')
  }
}

// 运行脚本
initUsers()
