const { sequelize } = require('../models/db');
const User = require('../models/User');
const AccountTransaction = require('../models/AccountTransaction');
const Task = require('../models/Task');

/**
 * 用户账户充值
 * @param {number} userId - 用户ID
 * @param {number} amount - 充值金额
 * @param {string} externalTransactionId - 外部交易ID（如支付宝订单号）
 * @param {string} description - 交易描述
 * @returns {Object} 包含交易记录和更新后的用户信息
 */
const rechargeAccount = async (userId, amount, externalTransactionId = null, description = '账户充值') => {
  // 验证参数
  if (!userId || !amount || amount <= 0) {
    throw new Error('无效的充值参数');
  }

  // 开始事务
  const transaction = await sequelize.transaction();

  try {
    // 查找用户并锁定行以防止并发问题
    const user = await User.findByPk(userId, { 
      lock: transaction.LOCK.UPDATE,
      transaction 
    });

    if (!user) {
      await transaction.rollback();
      throw new Error('用户不存在');
    }

    // 记录充值前余额
    const balanceBefore = parseFloat(user.balance);
    const rechargeAmount = parseFloat(amount);
    
    // 更新用户余额和总充值金额
    user.balance = balanceBefore + rechargeAmount;
    user.rechargeAmount = parseFloat(user.rechargeAmount) + rechargeAmount;
    
    // 保存用户信息
    await user.save({ transaction });
    
    // 创建交易记录
    const accountTransaction = await AccountTransaction.create({
      userId,
      type: 'recharge',
      amount: rechargeAmount,
      balanceBefore,
      balanceAfter: user.balance,
      description,
      status: 'completed',
      externalTransactionId,
      transactionTime: new Date()
    }, { transaction });
    
    // 提交事务
    await transaction.commit();
    
    return {
      transaction: accountTransaction,
      user: {
        id: user.id,
        username: user.username,
        balance: user.balance,
        rechargeAmount: user.rechargeAmount,
        consumeAmount: user.consumeAmount
      }
    };
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    throw new Error(`充值处理失败: ${error.message}`);
  }
};

/**
 * 消费用户账户余额
 * @param {number} userId - 用户ID
 * @param {number} amount - 消费金额
 * @param {number} taskId - 关联任务ID
 * @param {string} description - 交易描述
 * @returns {Object} 包含交易记录和更新后的用户信息
 */
const consumeAccount = async (userId, amount, taskId = null, description = '视频处理服务费用') => {
  // 验证参数
  if (!userId || !amount || amount <= 0) {
    throw new Error('无效的消费参数');
  }

  // 开始事务
  const transaction = await sequelize.transaction();

  try {
    // 查找用户并锁定行
    const user = await User.findByPk(userId, { 
      lock: transaction.LOCK.UPDATE,
      transaction 
    });

    if (!user) {
      await transaction.rollback();
      throw new Error('用户不存在');
    }

    // 检查余额是否足够
    const balanceBefore = parseFloat(user.balance);
    const consumeAmount = parseFloat(amount);

    if (balanceBefore < consumeAmount) {
      await transaction.rollback();
      throw new Error('账户余额不足');
    }
    
    // 更新用户余额和总消费金额
    user.balance = balanceBefore - consumeAmount;
    user.consumeAmount = parseFloat(user.consumeAmount) + consumeAmount;
    
    // 保存用户信息
    await user.save({ transaction });
    
    // 创建交易记录
    const accountTransaction = await AccountTransaction.create({
      userId,
      type: 'consume',
      amount: consumeAmount,
      balanceBefore,
      balanceAfter: user.balance,
      description,
      status: 'completed',
      taskId,
      transactionTime: new Date()
    }, { transaction });
    
    // 如果提供了任务ID，则更新任务的费用
    if (taskId) {
      const task = await Task.findByPk(taskId, { transaction });
      if (task) {
        task.cost = consumeAmount;
        await task.save({ transaction });
      }
    }
    
    // 提交事务
    await transaction.commit();
    
    return {
      transaction: accountTransaction,
      user: {
        id: user.id,
        username: user.username,
        balance: user.balance,
        rechargeAmount: user.rechargeAmount,
        consumeAmount: user.consumeAmount
      }
    };
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    throw new Error(`消费处理失败: ${error.message}`);
  }
};

/**
 * 退款到用户账户
 * @param {number} userId - 用户ID
 * @param {number} amount - 退款金额
 * @param {number} taskId - 关联任务ID
 * @param {string} description - 交易描述
 * @returns {Object} 包含交易记录和更新后的用户信息
 */
const refundAccount = async (userId, amount, taskId = null, description = '服务退款') => {
  // 验证参数
  if (!userId || !amount || amount <= 0) {
    throw new Error('无效的退款参数');
  }

  // 开始事务
  const transaction = await sequelize.transaction();

  try {
    // 查找用户并锁定行
    const user = await User.findByPk(userId, { 
      lock: transaction.LOCK.UPDATE,
      transaction 
    });

    if (!user) {
      await transaction.rollback();
      throw new Error('用户不存在');
    }

    // 记录退款前余额
    const balanceBefore = parseFloat(user.balance);
    const refundAmount = parseFloat(amount);
    
    // 更新用户余额和总消费金额（减少消费额）
    user.balance = balanceBefore + refundAmount;
    user.consumeAmount = Math.max(0, parseFloat(user.consumeAmount) - refundAmount);
    
    // 保存用户信息
    await user.save({ transaction });
    
    // 创建交易记录
    const accountTransaction = await AccountTransaction.create({
      userId,
      type: 'refund',
      amount: refundAmount,
      balanceBefore,
      balanceAfter: user.balance,
      description,
      status: 'completed',
      taskId,
      transactionTime: new Date()
    }, { transaction });
    
    // 提交事务
    await transaction.commit();
    
    return {
      transaction: accountTransaction,
      user: {
        id: user.id,
        username: user.username,
        balance: user.balance,
        rechargeAmount: user.rechargeAmount,
        consumeAmount: user.consumeAmount
      }
    };
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    throw new Error(`退款处理失败: ${error.message}`);
  }
};

/**
 * 获取用户交易记录
 * @param {number} userId - 用户ID
 * @param {string} type - 交易类型（可选）
 * @returns {Array} 交易记录列表
 */
const getUserTransactions = async (userId, type = null) => {
  if (!userId) {
    throw new Error('用户ID不能为空');
  }

  try {
    if (type) {
      return await AccountTransaction.findByUserIdAndType(userId, type);
    } else {
      return await AccountTransaction.findByUserId(userId);
    }
  } catch (error) {
    throw new Error(`获取交易记录失败: ${error.message}`);
  }
};

module.exports = {
  rechargeAccount,
  consumeAccount,
  refundAccount,
  getUserTransactions
}; 