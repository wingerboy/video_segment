const { Sequelize } = require('sequelize');
const config = require('../config');

// 创建Sequelize实例
const sequelize = new Sequelize(
  config.DB_CONFIG.database,
  config.DB_CONFIG.username,
  config.DB_CONFIG.password,
  {
    host: config.DB_CONFIG.host,
    port: config.DB_CONFIG.port,
    dialect: config.DB_CONFIG.dialect,
    logging: config.DB_CONFIG.logging,
    dialectOptions: {
      // 您可能需要其他选项，如SSL
      // ssl: {
      //   rejectUnauthorized: true,
      // }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
};

// 在应用启动时测试连接
testConnection();

module.exports = sequelize; 