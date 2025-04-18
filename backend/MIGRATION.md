# MongoDB到MySQL数据迁移指南

本文档介绍如何将原有MongoDB数据库中的数据迁移到MySQL数据库。

## 准备工作

1. 确保您同时拥有MongoDB和MySQL数据库的访问权限
2. 确保已安装所有必要的依赖项（包括mongoose）
3. 配置环境变量

## 环境变量配置

在迁移之前，您需要在`.env`文件中配置以下环境变量：

```
# MySQL连接信息
DB_HOST=obmt6n863p9o68gw-mi.aliyun-cn-hangzhou-internet.oceanbase.cloud
DB_PORT=3306
DB_USER=wingerboy
DB_PASSWORD=your_password_here
DB_NAME=audio_app

# MongoDB连接信息（旧数据源）
MONGO_URI=mongodb://localhost:27017/video-segmentation
```

## 安装迁移工具依赖

如果您需要迁移现有MongoDB数据，请安装mongoose：

```bash
npm install mongoose
```

## 执行迁移

迁移工具位于`src/utils/migrate-mongodb-to-mysql.js`，执行以下命令开始迁移：

```bash
cd backend
node src/utils/migrate-mongodb-to-mysql.js
```

## 迁移过程

迁移工具将执行以下步骤：

1. 连接到MongoDB和MySQL数据库
2. 从MongoDB获取所有用户数据并迁移到MySQL
3. 创建用户ID映射表（MongoDB ObjectId -> MySQL id）
4. 使用ID映射表迁移视频数据
5. 保持关联关系不变

## 注意事项

1. 迁移过程是幂等的，多次运行不会重复导入相同的数据（依赖于用户名和邮箱的唯一性约束）
2. 迁移过程不会删除MySQL中的现有数据
3. 密码将原样迁移，无需重新哈希（因为MongoDB中已经是哈希密码）
4. 在执行迁移前，最好先备份MySQL数据库

## 故障排除

如果迁移过程中出现错误：

1. 检查数据库连接配置是否正确
2. 确保MySQL中的表结构符合要求
3. 查看错误日志，了解具体失败原因

迁移完成后，您可以启动应用程序，使用原有账号登录验证数据是否正确迁移。 