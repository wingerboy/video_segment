const sequelize = require('./db');
const User = require('./User');
const Video = require('./Video');
const Background = require('./Background');
const Task = require('./Task');
const AccountTransaction = require('./AccountTransaction');
const ModelUsage = require('./ModelUsage');
const InterfaceUsage = require('./InterfaceUsage');

// 定义模型关联 - 基于email字段而非userId

// 用户与视频的关联
User.hasMany(Video, { 
  foreignKey: 'email',
  sourceKey: 'email',
  constraints: false 
});
Video.belongsTo(User, { 
  foreignKey: 'email',
  targetKey: 'email',
  constraints: false
});

// 用户与背景的关联
User.hasMany(Background, { 
  foreignKey: 'email',
  sourceKey: 'email',
  constraints: false
});
Background.belongsTo(User, { 
  foreignKey: 'email',
  targetKey: 'email',
  constraints: false
});

// 用户与任务的关联
User.hasMany(Task, { 
  foreignKey: 'email',
  sourceKey: 'email',
  constraints: false
});
Task.belongsTo(User, { 
  foreignKey: 'email',
  targetKey: 'email',
  constraints: false
});

// 添加账户交易关联
User.hasMany(AccountTransaction, { 
  foreignKey: 'email',
  sourceKey: 'email',
  constraints: false
});
AccountTransaction.belongsTo(User, { 
  foreignKey: 'email',
  targetKey: 'email',
  constraints: false
});

// 设置模型关联关系
// Task 与 Video 的关联
Task.belongsTo(Video, { foreignKey: 'oriVideoId', as: 'video' });
Video.hasMany(Task, { foreignKey: 'oriVideoId', as: 'tasks' });

// Task 与 Background 的关联
Task.belongsTo(Background, { foreignKey: 'backgroundId', as: 'background' });
Background.hasMany(Task, { foreignKey: 'backgroundId', as: 'tasks' });

// 同步数据库表结构
const syncDatabase = async () => {
  try {
    // force: true 会删除现有表并重新创建
    // 生产环境中建议设置为 false
    await sequelize.sync({ force: false, alter: true });
    console.log('数据库表同步成功');
  } catch (error) {
    console.error('数据库表同步失败:', error);
  }
};

// 执行同步
syncDatabase();

module.exports = {
  sequelize,
  User,
  Video,
  Background,
  Task,
  AccountTransaction,
  ModelUsage,
  InterfaceUsage
}; 