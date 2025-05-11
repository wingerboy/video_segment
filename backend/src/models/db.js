const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

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
    timezone: '+08:00', // 设置为北京时间 (UTC+8)
    dialectOptions: {
      // 您可能需要其他选项，如SSL
      // ssl: {
      //   rejectUnauthorized: true,
      // },
      dateStrings: true,
      typeCast: function (field, next) {
        if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
          return field.string();
        }
        return next();
      }
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
    logger.info('尝试连接数据库:', {
      host: config.DB_CONFIG.host,
      port: config.DB_CONFIG.port,
      database: config.DB_CONFIG.database,
      user: config.DB_CONFIG.username
    });
    await sequelize.authenticate();
    logger.info('数据库连接成功');
  } catch (error) {
    logger.error('数据库连接失败:', { error: error.message, stack: error.stack });
  }
};

// 在应用启动时测试连接
testConnection();

module.exports = sequelize; 