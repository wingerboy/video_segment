const sequelize = require('./db');
const User = require('./User');
const Video = require('./Video');

// 定义模型关联
User.hasMany(Video, { foreignKey: 'userId' });
Video.belongsTo(User, { foreignKey: 'userId' });

// 同步数据库表结构
const syncDatabase = async () => {
  try {
    // force: true 会删除现有表并重新创建
    // 生产环境中建议设置为 false
    await sequelize.sync({ force: false });
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
  Video
}; 