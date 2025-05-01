# Video Segmentation Backend

视频分割处理后端服务，用于管理视频上传、任务分配和视频处理。

## 项目结构

```
backend/
├── src/               # 源代码
│   ├── config/        # 配置文件
│   ├── middleware/    # 中间件
│   ├── models/        # 数据库模型
│   ├── routes/        # API路由
│   ├── scripts/       # 脚本工具
│   └── services/      # 服务
├── uploads/           # 上传文件目录
│   ├── videos/        # 视频文件
│   └── backgrounds/   # 背景图片
├── .env               # 开发环境配置
└── .env.production    # 生产环境配置
```

## 环境配置

项目使用`.env`文件进行配置管理。根据不同环境，系统会自动加载对应的环境文件：

- 开发环境: `.env`
- 生产环境: `.env.production`

关键配置项:

```
# 服务配置
NODE_ENV=production       # 环境: development 或 production
PORT=6001                 # 服务端口

# URL配置
API_BASE_URL=https://to74zigu-nx6sqm6b-6001.zjrestapi.gpufree.cn:8443  # 后端API基础URL
FRONTEND_URL=https://to74zigu-nx6sqm6b-6000.zjrestapi.gpufree.cn:8443  # 前端URL

# 安全配置
INTERFACE_IDENTIFICATION=wingerboy  # 接口服务认证字符串
JWT_SECRET=your-secret-key          # JWT密钥
JWT_EXPIRES_IN=7d                   # JWT过期时间

# 数据库配置
DB_NAME=video_segment
DB_USER=root
DB_PASSWORD=password
DB_HOST=localhost

# 上传目录配置
UPLOAD_VIDEOS_DIR=uploads/videos
UPLOAD_URL_PATH=videos
UPLOAD_BACKGROUNDS_DIR=uploads/backgrounds
UPLOAD_BACKGROUNDS_URL_PATH=backgrounds
UPLOAD_FILE_SIZE_LIMIT=100  # 上传文件大小限制(MB)
```

## 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境

1. 创建或编辑 `.env.production` 文件，设置生产环境配置

### 3. 启动服务前的准备

1. 确保数据库已创建并可访问
2. 注册接口服务:

```bash
node src/scripts/register-interfaces.js
```

### 4. 启动服务

```bash
NODE_ENV=production npm start
```

或使用 PM2 管理:

```bash
pm2 start npm --name "video-segment-backend" -- start
```

## 系统架构

系统由三个主要部分组成:

1. **前端应用** - 用户界面，用于上传视频、创建任务和查看结果
2. **后端服务** - 管理用户、任务和调度
3. **接口服务** - 处理实际视频分割工作的Python服务

### 任务流程

1. 用户上传视频到后端
2. 用户创建处理任务，指定视频、背景和模型
3. 后端将任务状态设为waiting
4. 任务调度器找到空闲接口服务，分配任务
5. 接口服务处理任务，并通过回调报告进度
6. 任务完成后，用户可以查看结果

## 接口服务集成

接口服务需要实现以下功能:

1. **处理任务接口** - `/process` POST接口，接收任务数据
2. **定期发送心跳** - 每分钟发送一次心跳请求
3. **回调通知进度** - 通过回调URL定期更新任务状态

示例代码见 `src/scripts/example-interface-client.js`

## 维护与监控

### 查看任务状态

```bash
# 查询待处理任务
curl http://localhost:6001/api/tasks/admin/pending -H "Authorization: Bearer your_token"

# 查询接口状态
curl http://localhost:6001/api/tasks/admin/interfaces -H "Authorization: Bearer your_token"
```

### 常见问题排查

1. **接口服务不在线** - 检查心跳请求是否正常发送
2. **任务一直处于waiting状态** - 检查接口服务是否有空闲资源
3. **上传文件访问404** - 检查上传目录配置和静态文件服务 