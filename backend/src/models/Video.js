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
  originalVideo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  extractedForeground: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  backgroundImage: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  finalVideo: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
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
  timestamps: true,
  hooks: {
    beforeUpdate: (video) => {
      video.updatedAt = new Date();
    }
  }
});

module.exports = Video; 