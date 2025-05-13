const sequelize = require('../models/db');
const User = require('../models/User');
const AccountTransaction = require('../models/AccountTransaction');
const Task = require('../models/Task');

/**
 * 用户账户充值
 * @param {string} email - 用户邮箱
 * @param {number} amount - 充值金额
 * @param {string} interfaceAddress - 接口地址
 * @param {string} description - 交易描述
 * @returns {Object} 包含交易记录和更新后的用户信息
 */
const rechargeAccount = async (email, amount, interfaceAddress = null, description = '账户充值') => {
  // 验证参数
  if (!email || !amount || amount <= 0) {
    throw new Error('无效的充值参数');
  }

  // 开始事务
  const transaction = await sequelize.transaction();

  try {
    // 查找用户并锁定行以防止并发问题
    const user = await User.findByEmail(email);
    if (!user) {
      await transaction.rollback();
      throw new Error('用户不存在');
    }

    // 锁定用户记录
    await User.update(
      { updatedAt: sequelize.literal('updatedAt') }, 
      { 
        where: { email: email },
        transaction
      }
    );

    // 再次查询用户获取最新数据
    const lockedUser = await User.findByEmail(email, { transaction });
    
    // 记录充值前余额
    const balanceBefore = parseFloat(lockedUser.balance);
    const rechargeAmount = parseFloat(amount);
    
    // 更新用户余额和总充值金额
    lockedUser.balance = balanceBefore + rechargeAmount;
    lockedUser.rechargeAmount = parseFloat(lockedUser.rechargeAmount) + rechargeAmount;
    
    // 保存用户信息
    await lockedUser.save({ transaction });
    
    // 创建交易记录
    const accountTransaction = await AccountTransaction.create({
      email,
      interfaceAddress,
      transactionType: 'recharge',
      target: null,
      amount: rechargeAmount,
      description,
      transactionTime: new Date()
    }, { transaction });
    
    // 提交事务
    await transaction.commit();
    
    return {
      transaction: accountTransaction,
      user: {
        id: lockedUser.id,
        username: lockedUser.username,
        email: lockedUser.email,
        balance: lockedUser.balance,
        rechargeAmount: lockedUser.rechargeAmount,
        consumeAmount: lockedUser.consumeAmount
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
 * @param {string} email - 用户邮箱
 * @param {number} amount - 消费金额
 * @param {string} taskId - 关联任务ID
 * @param {string} interfaceAddress - 接口地址
 * @param {string} description - 交易描述
 * @returns {Object} 包含交易记录和更新后的用户信息
 */
const consumeAccount = async (email, amount, taskId = null, interfaceAddress = null, description = '视频处理服务费用') => {
  // 验证参数
  if (!email || !amount || amount <= 0) {
    throw new Error('无效的消费参数');
  }

  // 开始事务
  const transaction = await sequelize.transaction();

  try {
    // 查找用户
    const user = await User.findByEmail(email);
    if (!user) {
      await transaction.rollback();
      throw new Error('用户不存在');
    }

    // 锁定用户记录
    await User.update(
      { updatedAt: sequelize.literal('updatedAt') }, 
      { 
        where: { email: email },
        transaction
      }
    );

    // 再次查询用户获取最新数据
    const lockedUser = await User.findByEmail(email, { transaction });
    
    // 检查余额是否足够
    const balanceBefore = parseFloat(lockedUser.balance);
    const consumeAmount = parseFloat(amount);

    if (balanceBefore < consumeAmount) {
      await transaction.rollback();
      throw new Error('账户余额不足');
    }
    
    // 更新用户余额和总消费金额
    lockedUser.balance = balanceBefore - consumeAmount;
    lockedUser.consumeAmount = parseFloat(lockedUser.consumeAmount) + consumeAmount;
    
    // 保存用户信息
    await lockedUser.save({ transaction });
    
    // 创建交易记录
    const accountTransaction = await AccountTransaction.create({
      email,
      interfaceAddress,
      transactionType: 'consume',
      target: taskId ? taskId.toString() : null,
      amount: consumeAmount,
      description,
      transactionTime: new Date()
    }, { transaction });
    
    // 如果提供了任务ID，则更新任务的费用
    if (taskId) {
      const task = await Task.findByPk(taskId, { transaction });
      if (task) {
        task.taskCost = consumeAmount;
        await task.save({ transaction });
      }
    }
    
    // 提交事务
    await transaction.commit();
    
    return {
      transaction: accountTransaction,
      user: {
        id: lockedUser.id,
        username: lockedUser.username,
        email: lockedUser.email,
        balance: lockedUser.balance,
        rechargeAmount: lockedUser.rechargeAmount,
        consumeAmount: lockedUser.consumeAmount
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
 * @param {string} email - 用户邮箱
 * @param {number} amount - 退款金额
 * @param {string} taskId - 关联任务ID
 * @param {string} interfaceAddress - 接口地址
 * @param {string} description - 交易描述
 * @returns {Object} 包含交易记录和更新后的用户信息
 */
const refundAccount = async (email, amount, taskId = null, interfaceAddress = null, description = '服务退款') => {
  // 验证参数
  if (!email || !amount || amount <= 0) {
    throw new Error('无效的退款参数');
  }

  // 开始事务
  const transaction = await sequelize.transaction();

  try {
    // 查找用户
    const user = await User.findByEmail(email);
    if (!user) {
      await transaction.rollback();
      throw new Error('用户不存在');
    }

    // 锁定用户记录
    await User.update(
      { updatedAt: sequelize.literal('updatedAt') }, 
      { 
        where: { email: email },
        transaction
      }
    );

    // 再次查询用户获取最新数据
    const lockedUser = await User.findByEmail(email, { transaction });
    
    // 记录退款前余额
    const balanceBefore = parseFloat(lockedUser.balance);
    const refundAmount = parseFloat(amount);
    
    // 更新用户余额和总消费金额（减少消费额）
    lockedUser.balance = balanceBefore + refundAmount;
    lockedUser.consumeAmount = Math.max(0, parseFloat(lockedUser.consumeAmount) - refundAmount);
    
    // 保存用户信息
    await lockedUser.save({ transaction });
    
    // 创建交易记录
    const accountTransaction = await AccountTransaction.create({
      email,
      interfaceAddress,
      transactionType: 'refund',
      target: taskId ? taskId.toString() : null,
      amount: refundAmount,
      description,
      transactionTime: new Date()
    }, { transaction });
    
    // 提交事务
    await transaction.commit();
    
    return {
      transaction: accountTransaction,
      user: {
        id: lockedUser.id,
        username: lockedUser.username,
        email: lockedUser.email,
        balance: lockedUser.balance,
        rechargeAmount: lockedUser.rechargeAmount,
        consumeAmount: lockedUser.consumeAmount
      }
    };
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    throw new Error(`退款处理失败: ${error.message}`);
  }
};

/**
 * 转账到其他用户账户
 * @param {string} fromEmail - 转出用户邮箱
 * @param {string} toEmail - 转入用户邮箱
 * @param {number} amount - 转账金额
 * @param {string} interfaceAddress - 接口地址
 * @param {string} description - 交易描述
 * @returns {Object} 包含交易记录和更新后的用户信息
 */
const transferAccount = async (fromEmail, toEmail, amount, description = '账户转账') => {
  // 验证参数
  if (!fromEmail || !toEmail || !amount || amount <= 0) {
    throw new Error('无效的转账参数');
  }

  if (fromEmail === toEmail) {
    throw new Error('不能转账给自己');
  }

  // 开始事务
  const transaction = await sequelize.transaction();

  try {
    // 查找转出用户
    const fromUser = await User.findByEmail(fromEmail);
    // 查找转入用户
    const toUser = await User.findByEmail(toEmail);
    
    if (!fromUser || !toUser) {
      await transaction.rollback();
      throw new Error('用户不存在');
    }

    // 锁定转出用户记录
    await User.update(
      { updatedAt: sequelize.literal('updatedAt') }, 
      { 
        where: { email: fromEmail },
        transaction
      }
    );

    // 锁定转入用户记录
    await User.update(
      { updatedAt: sequelize.literal('updatedAt') }, 
      { 
        where: { email: toEmail },
        transaction
      }
    );

    // 再次查询用户获取最新数据
    const lockedFromUser = await User.findByEmail(fromEmail, { transaction });
    const lockedToUser = await User.findByEmail(toEmail, { transaction });
    
    // 检查余额是否足够
    const fromBalanceBefore = parseFloat(lockedFromUser.balance);
    const toBalanceBefore = parseFloat(lockedToUser.balance);
    const transferAmount = parseFloat(amount);

    if (fromBalanceBefore < transferAmount) {
      await transaction.rollback();
      throw new Error('账户余额不足');
    }
    
    // 更新转出用户余额和总转账金额
    lockedFromUser.balance = fromBalanceBefore - transferAmount;
    lockedFromUser.transferAmount = parseFloat(lockedFromUser.transferAmount) + transferAmount;
    
    // 更新转入用户余额
    lockedToUser.balance = toBalanceBefore + transferAmount;
    
    // 保存用户信息
    await lockedFromUser.save({ transaction });
    await lockedToUser.save({ transaction });
    
    // 创建转出交易记录
    const fromTransaction = await AccountTransaction.create({
      email: fromEmail,
      transactionType: 'transfer',
      target: toEmail,
      amount: transferAmount,
      description: `${description} - 转出至 ${toEmail}`,
      transactionTime: new Date()
    }, { transaction });

    // 创建转入交易记录
    const toTransaction = await AccountTransaction.create({
      email: toEmail,
      transactionType: 'transfer',
      target: fromEmail,
      amount: transferAmount,
      description: `${description} - 接收自 ${fromEmail}`,
      transactionTime: new Date()
    }, { transaction });
    
    // 提交事务
    await transaction.commit();
    
    return {
      fromTransaction,
      toTransaction,
      fromUser: {
        id: lockedFromUser.id,
        username: lockedFromUser.username,
        email: lockedFromUser.email,
        balance: lockedFromUser.balance,
        transferAmount: lockedFromUser.transferAmount
      },
      toUser: {
        id: lockedToUser.id,
        username: lockedToUser.username,
        email: lockedToUser.email,
        balance: lockedToUser.balance
      }
    };
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    throw new Error(`转账处理失败: ${error.message}`);
  }
};

/**
 * 获取用户交易记录
 * @param {string} email - 用户邮箱
 * @param {string} transactionType - 交易类型（可选）
 * @returns {Array} 交易记录列表
 */
const getUserTransactions = async (email, transactionType = null) => {
  if (!email) {
    throw new Error('用户邮箱不能为空');
  }

  try {
    if (transactionType) {
      return await AccountTransaction.findByEmailAndType(email, transactionType);
    } else {
      return await AccountTransaction.findByEmail(email);
    }
  } catch (error) {
    throw new Error(`获取交易记录失败: ${error.message}`);
  }
};

module.exports = {
  rechargeAccount,
  consumeAccount,
  refundAccount,
  transferAccount,
  getUserTransactions
}; 