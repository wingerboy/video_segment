const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// 定义交易记录模型
const AccountTransaction = sequelize.define('AccountTransaction', {
  // 交易记录ID，自增主键
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // 用户邮箱
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  // 接口地址
  interfaceAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '接口地址'
  },
  // 交易类型: recharge(充值), consume(消费), refund(退款), transfer(转账)
  transactionType: {
    type: DataTypes.ENUM('recharge', 'consume', 'refund', 'transfer'),
    allowNull: false,
    comment: '交易类型'
  },
  // 交易对象
  target: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '交易对象，consume时候是taskid， transfer是userid'
  },
  // 交易金额
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  // 交易描述
  description: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '交易描述'
  },
  // 交易时间
  transactionTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'account_transactions',
  timestamps: true,
  createdAt: 'transactionTime',
  updatedAt: false,
});

// 查找用户所有交易记录
AccountTransaction.findByEmail = async function(email) {
  return this.findAll({ 
    where: { email },
    order: [['transactionTime', 'DESC']]
  });
};

// 查找用户特定类型的交易记录
AccountTransaction.findByEmailAndType = async function(email, type) {
  return this.findAll({ 
    where: { email, transactionType: type },
    order: [['transactionTime', 'DESC']] 
  });
};

module.exports = AccountTransaction; 