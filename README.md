# 视频分割Web应用

这是一个用于视频分割和背景替换的全栈Web应用程序，使用React、Node.js、Express和MySQL构建。

## 功能特性

- 用户注册和身份验证
- 视频上传和处理
- 视频前景提取（通过AI）
- 自定义背景替换
- 视频管理

## 技术栈

### 前端
- React
- React Router
- Material-UI
- Formik & Yup（表单验证）
- Axios（API请求）

### 后端
- Node.js
- Express
- MySQL（使用Sequelize ORM）
- JWT身份验证
- Bull（任务队列）
- Multer（文件上传）

## 先决条件

- Node.js (v14+)
- MySQL数据库
- npm或yarn

## 安装指南

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/video-segmentation-app.git
cd video-segmentation-app
```

### 2. 设置MySQL数据库

使用以下命令连接到您的MySQL数据库：

```bash
mysql -h obmt6n863p9o68gw-mi.aliyun-cn-hangzhou-internet.oceanbase.cloud -P 3306 -u wingerboy -D audio_app -p
```

输入密码后，可以执行`backend/database.sql`中的SQL命令来创建必要的表。

### 3. 设置后端

```bash
# 导航到后端目录
cd backend

# 安装依赖
npm install

# 创建.env文件并添加您的配置
# 示例:
# PORT=5001
# DB_HOST=obmt6n863p9o68gw-mi.aliyun-cn-hangzhou-internet.oceanbase.cloud
# DB_PORT=3306
# DB_USER=wingerboy
# DB_PASSWORD=your_password_here
# DB_NAME=audio_app
# JWT_SECRET=your_jwt_secret_key_change_in_production
# AI_API_URL=http://localhost:8000

# 启动服务器
npm run dev
```

### 4. 设置前端

```bash
# 导航到前端目录
cd ../frontend

# 安装依赖
npm install

# 启动React开发服务器
npm start
```

## 使用方法

1. 打开浏览器并访问`http://localhost:6000`
2. 注册新账户或登录
3. 上传视频进行处理
4. （可选）上传背景图片
5. 查看并下载处理后的视频

## 开发说明

该项目包含用于开发目的的模拟AI API响应。
要集成真实的AI后端，请更新`backend/src/services/queue.js`中的API端点。

## 文件夹结构

```
├── backend/                 # 后端代码
│   ├── src/                 # 源代码
│   │   ├── models/          # 数据库模型
│   │   ├── routes/          # API路由
│   │   ├── middleware/      # 中间件函数
│   │   ├── services/        # 服务（队列等）
│   │   └── index.js         # 服务器入口点
│   ├── uploads/             # 上传的文件
│   ├── database.sql         # 数据库初始化脚本
│   └── package.json         # 后端依赖
│
└── frontend/                # 前端代码
    ├── src/                 # 源代码
    │   ├── components/      # React组件
    │   ├── contexts/        # 上下文提供者
    │   ├── services/        # API服务
    │   ├── utils/           # 实用功能
    │   ├── App.js           # 主App组件
    │   └── index.js         # React入口点
    └── package.json         # 前端依赖
```

## 从MongoDB迁移

此应用最初使用MongoDB开发，现已迁移到MySQL。如果您仍然有MongoDB数据需要迁移，您需要编写迁移脚本来将数据从MongoDB转移到MySQL。

## 许可证

MIT 