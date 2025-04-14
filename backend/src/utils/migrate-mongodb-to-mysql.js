/**
 * MongoDB数据迁移到MySQL工具
 * 
 * 此脚本用于将MongoDB数据库中的数据迁移到MySQL数据库
 * 使用前请确保已安装所需依赖并配置了正确的数据库连接
 * 
 * 使用方法: node migrate-mongodb-to-mysql.js
 */

const mongoose = require('mongoose');
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// 加载环境变量
dotenv.config();

// 旧的MongoDB模型定义
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  createdAt: Date
});

const videoSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  originalVideo: String,
  extractedForeground: String,
  backgroundImage: String,
  finalVideo: String,
  status: String,
  createdAt: Date,
  updatedAt: Date
});

const OldUser = mongoose.model('User', userSchema);
const OldVideo = mongoose.model('Video', videoSchema);

// MySQL连接设置
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
  }
);

// 新的MySQL模型
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true
});

const Video = sequelize.define('Video', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  originalVideo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  extractedForeground: {
    type: DataTypes.STRING,
    allowNull: true
  },
  backgroundImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  finalVideo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'videos',
  timestamps: true
});

// MongoDB连接
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/video-segmentation');
    console.log('已连接到MongoDB');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 迁移用户数据
async function migrateUsers() {
  try {
    console.log('开始迁移用户数据...');
    
    // 获取所有MongoDB用户
    const oldUsers = await OldUser.find();
    console.log(`找到 ${oldUsers.length} 个用户需要迁移`);
    
    // 用户ID映射 (MongoDB ObjectId -> MySQL id)
    const userIdMap = {};
    
    // 迁移每个用户
    for (const oldUser of oldUsers) {
      const newUser = await User.create({
        username: oldUser.username,
        email: oldUser.email,
        password: oldUser.password, // 已经是哈希过的密码
        createdAt: oldUser.createdAt || new Date(),
        updatedAt: new Date()
      });
      
      // 保存ID映射关系
      userIdMap[oldUser._id.toString()] = newUser.id;
      
      console.log(`已迁移用户: ${oldUser.username}`);
    }
    
    console.log('用户迁移完成!');
    return userIdMap;
  } catch (error) {
    console.error('用户迁移失败:', error);
    throw error;
  }
}

// 迁移视频数据
async function migrateVideos(userIdMap) {
  try {
    console.log('开始迁移视频数据...');
    
    // 获取所有MongoDB视频
    const oldVideos = await OldVideo.find();
    console.log(`找到 ${oldVideos.length} 个视频需要迁移`);
    
    // 迁移每个视频
    for (const oldVideo of oldVideos) {
      // 获取对应的MySQL用户ID
      const newUserId = userIdMap[oldVideo.userId.toString()];
      
      if (!newUserId) {
        console.warn(`警告: 找不到视频 ${oldVideo._id} 对应的用户 ${oldVideo.userId}`);
        continue;
      }
      
      await Video.create({
        userId: newUserId,
        originalVideo: oldVideo.originalVideo,
        extractedForeground: oldVideo.extractedForeground,
        backgroundImage: oldVideo.backgroundImage,
        finalVideo: oldVideo.finalVideo,
        status: oldVideo.status || 'pending',
        createdAt: oldVideo.createdAt || new Date(),
        updatedAt: oldVideo.updatedAt || new Date()
      });
      
      console.log(`已迁移视频: ${oldVideo._id}`);
    }
    
    console.log('视频迁移完成!');
  } catch (error) {
    console.error('视频迁移失败:', error);
    throw error;
  }
}

// 主迁移函数
async function migrateData() {
  try {
    // 1. 连接两个数据库
    await connectToMongoDB();
    await sequelize.authenticate();
    console.log('已连接到MySQL');
    
    // 2. 同步MySQL表结构
    await sequelize.sync({ force: false });
    
    // 3. 迁移用户数据并获取ID映射
    const userIdMap = await migrateUsers();
    
    // 4. 迁移视频数据
    await migrateVideos(userIdMap);
    
    console.log('数据迁移完成!');
    process.exit(0);
  } catch (error) {
    console.error('迁移过程中出错:', error);
    process.exit(1);
  }
}

// 执行迁移
migrateData(); 