const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// 定义Background模型 - 背景图库
const Background = sequelize.define('Background', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  md5Hash: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '背景图MD5哈希值'
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '背景图存储路径'
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '背景图大小（字节）'
  },
  dimensions: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '背景图尺寸，例如 "1920x1080"'
  },
  status: {
    type: DataTypes.ENUM('active', 'deleted', 'expired'),
    defaultValue: 'active',
    comment: '背景图状态：存在、删除、过期等'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '背景图使用次数'
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
  tableName: 'backgrounds',
  timestamps: true,
  hooks: {
    beforeUpdate: (background) => {
      background.updatedAt = new Date();
    }
  }
});

module.exports = Background; 