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
  // 关联的用户ID
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // 交易类型: recharge(充值), consume(消费), refund(退款)
  type: {
    type: DataTypes.ENUM('recharge', 'consume', 'refund'),
    allowNull: false
  },
  // 交易金额
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  // 交易前余额
  balanceBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  // 交易后余额
  balanceAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  // 交易描述
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // 交易状态: pending(处理中), completed(已完成), failed(失败)
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
    allowNull: false
  },
  // 关联的任务ID (如果是任务消费)
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  // 外部交易号 (如支付宝或微信支付订单号)
  externalTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // 交易时间
  transactionTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  // 创建时间
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  // 更新时间
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'account_transactions',
  timestamps: true,
  // 在更新前更新updatedAt
  hooks: {
    beforeUpdate: (transaction) => {
      transaction.updatedAt = new Date();
    }
  }
});

// 查找用户所有交易记录
AccountTransaction.findByUserId = async function(userId) {
  return this.findAll({ 
    where: { userId },
    order: [['transactionTime', 'DESC']]
  });
};

// 查找用户特定类型的交易记录
AccountTransaction.findByUserIdAndType = async function(userId, type) {
  return this.findAll({ 
    where: { userId, type },
    order: [['transactionTime', 'DESC']] 
  });
};

module.exports = AccountTransaction; 