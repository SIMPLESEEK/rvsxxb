# 列配置管理脚本

本目录包含用于管理和恢复列配置的脚本，防止意外删除重要的自定义列配置。

## 脚本说明

### 1. backup-columns.js
**功能**: 备份当前数据库中的所有列配置
**使用方法**: 
```bash
node scripts/backup-columns.js
```
**输出**: 在 `backups/` 目录下生成带时间戳的备份文件

### 2. restore-deleted-columns.js
**功能**: 恢复被意外删除的15个自定义列配置
**使用方法**: 
```bash
node scripts/restore-deleted-columns.js
```
**说明**: 这个脚本包含了之前被删除的15个重要列的定义

### 3. restore-from-backup.js
**功能**: 从备份文件完全恢复列配置
**使用方法**: 
```bash
# 使用最新备份文件
node scripts/restore-from-backup.js

# 使用指定备份文件
node scripts/restore-from-backup.js backups/columns-backup-2025-06-06T03-31-37-521Z.json
```

## 重要的自定义列

以下15个列是重要的业务数据，设置为隐藏状态（isVisible: false），仅管理员可见：

### 供应商信息
- `vendorBody1` - 灯体供应商1
- `vendorBody2` - 灯体供应商2
- `vendorLED` - LED供应商
- `vendorDriver` - 驱动供应商
- `vendorLens` - 透镜供应商
- `vendorAccessory` - 配件供应商

### 成本信息
- `costBody1` - 灯体成本1
- `costBody2` - 灯体成本2
- `costLED` - LED成本
- `costDriver` - 驱动成本
- `costLens` - 透镜成本
- `costAccessory` - 配件成本

### 财务分析
- `totalCost` - 总成本
- `profitMargin` - 利润率

### 内部管理
- `internalNotes` - 内部备注

## 安全措施

### 1. 自动备份
建议在进行任何列配置修改前先运行备份脚本：
```bash
node scripts/backup-columns.js
```

### 2. 重置API保护
`/api/reset-columns` API 已经修改，现在会自动保护隐藏的自定义列，重置时不会删除它们。

### 3. 定期备份
建议设置定期备份任务，例如每天备份一次列配置。

## 故障恢复流程

### 如果列配置被意外删除：

1. **立即停止操作**，避免进一步的数据丢失

2. **检查备份**：
   ```bash
   ls backups/
   ```

3. **从最新备份恢复**：
   ```bash
   node scripts/restore-from-backup.js
   ```

4. **或者恢复特定的自定义列**：
   ```bash
   node scripts/restore-deleted-columns.js
   ```

5. **验证恢复结果**：
   - 登录管理后台
   - 检查列管理页面
   - 确认所有31个列都存在（16个可见 + 15个隐藏）

## 注意事项

1. **环境变量**: 脚本中硬编码了数据库连接信息，生产环境中应该使用环境变量
2. **权限**: 这些脚本直接操作数据库，请谨慎使用
3. **备份存储**: 备份文件包含敏感的业务信息，请妥善保管
4. **测试**: 在生产环境使用前，请在测试环境中验证脚本功能

## 联系信息

如有问题，请联系系统管理员或开发团队。
