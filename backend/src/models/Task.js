const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// 定义Task模型 - 视频处理任务
const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    },
    comment: '用户ID'
  },
  interfaceAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '接口地址'
  },
  oriVideoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  backgroundId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  oriVideoPath: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
    comment: '源视频文件路径'
  },
  foreVideoPath: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
    comment: '前景视频文件路径'
  },
  backgroundPath: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
    comment: '背景图文件路径'
  },
  outputVideoPath: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
    comment: '合成视频输出路径'
  },
  taskStatus: {
    type: DataTypes.ENUM('waiting', 'processing', 'completed', 'failed'),
    defaultValue: 'waiting',
    allowNull: false,
    comment: '任务状态：等待中、正在执行、处理完成、执行失败'
  },
  taskProgress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '任务进度'
  },
  taskRespose: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
    comment: '任务结果描述'
  },
  taskDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '任务执行时长（秒）'
  },
  taskStartTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '任务开始时间'
  },
  taskUpdateTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '任务更新时间'
  },
  taskCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '任务费用'
  },
  modelName: {
    type: DataTypes.STRING,
    defaultValue: '',
    allowNull: false,
    comment: '模型名'
  },
  modelAlias: {
    type: DataTypes.STRING,
    defaultValue: '',
    allowNull: false,
    comment: '模型别名'
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  createdAt: 'taskStartTime',
  updatedAt: 'taskUpdateTime',
  hooks: {
    beforeUpdate: (task) => {
      task.taskUpdateTime = new Date();
    }
  }
});

// 查找用户所有任务
Task.findByEmail = async function(email) {
  return this.findAll({ 
    where: { email },
    order: [['taskStartTime', 'DESC']]
  });
};

// 通过状态查找任务
Task.findByStatus = async function(status) {
  return this.findAll({ 
    where: { taskStatus: status },
    order: [['taskStartTime', 'ASC']]
  });
};

module.exports = Task; 