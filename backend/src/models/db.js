const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// 创建Sequelize实例
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // 设置为true以在控制台查看SQL查询
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