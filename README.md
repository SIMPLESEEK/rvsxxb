# RVS Lighting 报价系统 (xxbaug)

一个基于 Next.js 的现代化照明产品报价管理系统，专为 RVS Lighting 设计。

## 🌟 主要功能

### 产品管理
- **智能产品选型**：支持色温、光束角、外观颜色、控制方式四个可变参数
- **自动订货代码生成**：根据选择的参数自动生成产品型号
- **产品搜索与筛选**：支持多条件搜索和智能匹配
- **移动端优化**：响应式设计，完美支持手机和平板设备

### 报价系统
- **项目清单管理**：支持添加产品到项目清单，自动计算总价
- **报价单生成**：专业的报价单格式，支持打印和PDF导出
- **价格管理**：支持含税价、市场价显示，ON/OFF产品自动显示价格
- **模板系统**：支持保存和加载报价模板

### 用户权限
- **多角色支持**：管理员、经销商、普通用户三种角色
- **权限控制**：不同角色看到不同的列和功能
- **安全认证**：基于 NextAuth.js 的安全登录系统

### 管理功能
- **产品管理**：管理员可以添加、编辑、删除产品
- **用户管理**：管理员可以管理用户账户和权限
- **列配置**：灵活的列显示配置，支持自定义显示内容
- **数据备份**：支持数据导出和备份功能

## 🚀 技术栈

- **前端框架**：Next.js 15 (App Router)
- **UI 框架**：Tailwind CSS + Radix UI
- **数据库**：MongoDB Atlas
- **认证系统**：NextAuth.js
- **文件存储**：腾讯云 COS
- **部署平台**：Vercel
- **开发语言**：TypeScript

## 📦 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 yarn
- MongoDB 数据库
- 腾讯云 COS 存储（可选）

### 安装依赖
```bash
npm install
```

### 环境配置
参考 `.env.example` 文件创建 `.env.local` 文件并配置相应的环境变量。

### 初始化数据库
```bash
# 创建管理员账户（需要先设置 MONGODB_URI 环境变量）
node scripts/init-admin.js
```

### 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🔧 部署到 Vercel

### 1. 准备工作
确保所有环境变量已在 Vercel 项目设置中配置。

### 2. 自动部署
推送代码到 GitHub，Vercel 会自动部署。

### 3. 手动部署
```bash
npm run build
vercel --prod
```

## 📖 使用指南

### 主要操作流程
1. **登录系统**：使用管理员提供的账户登录
2. **产品选型**：在产品列表页面选择所需产品和参数
3. **添加到项目**：将选中的产品添加到项目清单
4. **生成报价**：在项目清单页面生成和打印报价单
5. **管理数据**：管理员可以在后台管理产品和用户

## 🛠️ 系统维护

### 维护脚本
- `scripts/init-admin.js` - 初始化管理员账户
- 其他维护脚本请查看 `scripts/` 目录

### 部署指南
详细部署说明请参考 `docs/deployment-guide.md`

## 📝 项目结构

```
xxbaug/
├── src/
│   ├── app/                 # Next.js App Router 页面
│   ├── components/          # React 组件
│   ├── lib/                 # 工具库和数据模型
│   └── types/               # TypeScript 类型定义
├── docs/                    # 项目文档（本地维护）
├── scripts/                 # 维护脚本（本地维护）
└── public/                  # 静态资源
```

**注意**：`docs/` 和 `scripts/` 目录包含敏感信息，已在 `.gitignore` 中忽略，不会上传到代码仓库。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目为 RVS Lighting 专有项目。

## 📞 联系方式

- **项目联系人**：Eva@rvs-lighting.com
- **技术支持**：请通过 GitHub Issues 提交问题

---

© 2024 RVS Lighting. All rights reserved.
