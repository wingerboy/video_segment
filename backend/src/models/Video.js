const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// 定义Video模型
const Video = sequelize.define('Video', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '视频名称'
  },
  md5Hash: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '视频MD5哈希值'
  },
  originalVideo: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '原始视频路径'
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '视频大小（字节）'
  },
  dimensions: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '视频尺寸，例如 "1920x1080"'
  },
  frameCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '视频总帧数'
  },
  extractedForeground: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: '提取的前景视频路径'
  },
  backgroundImage: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: '背景图路径'
  },
  finalVideo: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: '合成的最终视频路径'
  },
  status: {
    type: DataTypes.ENUM('active', 'deleted', 'expired', 'pending', 'processing', 'completed', 'failed'),
    defaultValue: 'active',
    comment: '视频状态：存在、删除、过期等'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '视频使用次数'
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
  timestamps: true,
  hooks: {
    beforeUpdate: (video) => {
      video.updatedAt = new Date();
    }
  }
});

module.exports = Video; 