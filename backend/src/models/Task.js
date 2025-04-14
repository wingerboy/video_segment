const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// 定义Task模型 - 视频处理任务
const Task = sequelize.define('Task', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '用户ID'
  },
  sourceVideoMd5: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '源视频MD5哈希值'
  },
  sourceVideoPath: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '源视频文件路径'
  },
  maskPath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '视频蒙版文件路径'
  },
  backgroundPath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '背景图文件路径'
  },
  outputVideoPath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '合成视频输出路径'
  },
  status: {
    type: DataTypes.ENUM('waiting', 'processing', 'completed', 'failed'),
    defaultValue: 'waiting',
    comment: '任务状态：等待中、正在执行、处理完成、执行失败'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '任务执行时长（秒）'
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '任务费用'
  },
  startTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '任务开始时间'
  },
  updateTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '任务更新时间'
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  createdAt: 'startTime',
  updatedAt: 'updateTime',
  hooks: {
    beforeUpdate: (task) => {
      task.updateTime = new Date();
    }
  }
});

module.exports = Task; 