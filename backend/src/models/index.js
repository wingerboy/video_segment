const sequelize = require('./db');
const User = require('./User');
const Video = require('./Video');
const Background = require('./Background');
const Task = require('./Task');
const AccountTransaction = require('./AccountTransaction');

// 定义模型关联
User.hasMany(Video, { foreignKey: 'userId' });
Video.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Background, { foreignKey: 'userId' });
Background.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

// 添加账户交易关联
User.hasMany(AccountTransaction, { foreignKey: 'userId' });
AccountTransaction.belongsTo(User, { foreignKey: 'userId' });

// 任务和交易关联（一个任务可能产生一个消费交易）
Task.hasOne(AccountTransaction, { foreignKey: 'taskId' });
AccountTransaction.belongsTo(Task, { foreignKey: 'taskId' });

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
  AccountTransaction
}; 