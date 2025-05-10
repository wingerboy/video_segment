/**
 * MySQL环境设置脚本
 * 
 * 此脚本用于自动连接MySQL数据库并创建所需的表
 * 执行: node setup-mysql.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

async function setupDatabase() {
  let connection;
  
  try {
    console.log('正在连接到MySQL数据库...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.VIDEO_DB_HOST,
      port: process.env.VIDEO_DB_PORT,
      user: process.env.VIDEO_DB_USER,
      password: process.env.VIDEO_DB_PASSWORD,
      database: process.env.VIDEO_DB_NAME,
      multipleStatements: true // 允许执行多个SQL语句
    });
    
    console.log('成功连接到MySQL数据库');
    
    // 读取SQL初始化脚本
    const sqlFilePath = path.join(__dirname, 'database.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('开始执行SQL初始化脚本...');
    
    // 执行SQL脚本
    await connection.query(sqlScript);
    
    console.log('数据库表创建成功');
    console.log('MySQL环境设置完成!');
    
  } catch (error) {
    console.error('设置数据库时出错:', error);
  } finally {
    // 关闭数据库连接
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

setupDatabase(); 