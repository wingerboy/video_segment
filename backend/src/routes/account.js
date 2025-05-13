const express = require('express');
const router = express.Router();
const { rechargeAccount, consumeAccount, refundAccount, transferAccount, getUserTransactions } = require('../services/accountService');
const { authenticate, isAdmin, isAgent } = require('../middleware/auth');
const { User } = require('../models');
const { Op } = require('sequelize');

/**
 * @api {get} /account/transactions 获取用户交易记录
 * @apiName GetUserTransactions
 * @apiGroup Account
 * @apiParam {String} [transactionType] 交易类型过滤：recharge, consume, refund, transfer
 * @apiSuccess {Array} transactions 交易记录列表
 */
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const email = req.user.email;
    const { transactionType } = req.query;
    
    const transactions = await getUserTransactions(email, transactionType);
    
    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('获取交易记录失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取交易记录失败'
    });
  }
});

/**
 * @api {post} /account/recharge 账户充值
 * @apiName RechargeAccount
 * @apiGroup Account
 * @apiParam {Number} amount 充值金额
 * @apiParam {String} [interfaceAddress] 接口地址
 * @apiParam {String} [description] 交易描述
 * @apiSuccess {Object} transaction 交易记录
 * @apiSuccess {Object} user 更新后的用户信息
 */
router.post('/recharge', authenticate, async (req, res) => {
  try {
    const email = req.user.email;
    const { amount, interfaceAddress, description } = req.body;
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的充值金额'
      });
    }
    
    const result = await rechargeAccount(
      email, 
      parseFloat(amount), 
      interfaceAddress,
      description
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('账户充值失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '账户充值失败'
    });
  }
});

/**
 * @api {post} /account/consume 消费账户余额
 * @apiName ConsumeAccount
 * @apiGroup Account
 * @apiParam {Number} amount 消费金额
 * @apiParam {Number} [taskId] 关联任务ID
 * @apiParam {String} [interfaceAddress] 接口地址
 * @apiParam {String} [description] 交易描述
 * @apiSuccess {Object} transaction 交易记录
 * @apiSuccess {Object} user 更新后的用户信息
 */
router.post('/consume', authenticate, async (req, res) => {
  try {
    const email = req.user.email;
    const { amount, taskId, interfaceAddress, description } = req.body;
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的消费金额'
      });
    }
    
    const result = await consumeAccount(
      email, 
      parseFloat(amount), 
      taskId,
      interfaceAddress,
      description
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('账户消费失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '账户消费失败'
    });
  }
});

/**
 * @api {post} /account/refund 退款到账户
 * @apiName RefundAccount
 * @apiGroup Account
 * @apiParam {String} email 用户邮箱 (仅管理员可指定)
 * @apiParam {Number} amount 退款金额
 * @apiParam {Number} [taskId] 关联任务ID
 * @apiParam {String} [interfaceAddress] 接口地址
 * @apiParam {String} [description] 交易描述
 * @apiSuccess {Object} transaction 交易记录
 * @apiSuccess {Object} user 更新后的用户信息
 */
router.post('/refund', authenticate, isAdmin, async (req, res) => {
  try {
    const { email, amount, taskId, interfaceAddress, description } = req.body;
    
    if (!email || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户邮箱和退款金额'
      });
    }
    
    const result = await refundAccount(
      email, 
      parseFloat(amount), 
      taskId,
      interfaceAddress,
      description
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('账户退款失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '账户退款失败'
    });
  }
});

/**
 * @api {post} /account/transfer 转账到其他账户
 * @apiName TransferAccount
 * @apiGroup Account
 * @apiParam {String} toEmail 接收方用户邮箱
 * @apiParam {Number} amount 转账金额
 * @apiParam {String} [interfaceAddress] 接口地址
 * @apiParam {String} [description] 交易描述
 * @apiSuccess {Object} fromTransaction 转出交易记录
 * @apiSuccess {Object} toTransaction 转入交易记录
 * @apiSuccess {Object} fromUser 转出用户信息
 * @apiSuccess {Object} toUser 转入用户信息
 */
router.post('/transfer', authenticate, async (req, res) => {
  try {
    const fromEmail = req.user.email;
    const { toEmail, amount, description } = req.body;
    
    if (!toEmail || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的接收方邮箱和转账金额'
      });
    }
    
    const result = await transferAccount(
      fromEmail,
      toEmail,
      parseFloat(amount),
      description
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('账户转账失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '账户转账失败'
    });
  }
});

/**
 * @api {get} /account/admin/transactions/:email 管理员获取指定用户交易记录
 * @apiName AdminGetUserTransactions
 * @apiGroup Account
 * @apiParam {String} email 用户邮箱
 * @apiParam {String} [transactionType] 交易类型过滤：recharge, consume, refund, transfer
 * @apiSuccess {Array} transactions 交易记录列表
 */
router.get('/admin/transactions/:email', authenticate, isAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const { transactionType } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户邮箱'
      });
    }
    
    const transactions = await getUserTransactions(email, transactionType);
    
    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('获取用户交易记录失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取用户交易记录失败'
    });
  }
});

/**
 * @api {get} /account/search-users 代理商查找用户
 * @apiName SearchUsers
 * @apiGroup Account
 * @apiParam {String} keyword 关键词，用于搜索用户名或邮箱
 * @apiSuccess {Array} users 用户列表
 */
router.get('/search-users', authenticate, isAgent, async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '请输入至少2个字符的搜索关键词'
      });
    }
    
    // 查找普通用户（role='user'）且状态为活跃(userStatus='active')的用户
    const users = await User.findAll({
      where: {
        [Op.and]: [
          { role: 'user' },
          { userStatus: 'active' },
          {
            [Op.or]: [
              { username: { [Op.like]: `%${keyword}%` } },
              { email: { [Op.like]: `%${keyword}%` } }
            ]
          }
        ]
      },
      attributes: ['id', 'username', 'email', 'balance', 'createdAt'],
      limit: 10 // 限制返回数量
    });
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('查找用户失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '查找用户失败'
    });
  }
});

/**
 * @api {get} /account/agent-transfers 代理商获取划扣记录
 * @apiName GetAgentTransfers
 * @apiGroup Account
 * @apiSuccess {Array} transactions 划扣记录列表
 */
router.get('/agent-transfers', authenticate, isAgent, async (req, res) => {
  try {
    const email = req.user.email;
    
    // 只获取转账类型(transactionType='transfer')且由当前代理商发起的交易记录
    const transactions = await getUserTransactions(email, 'transfer');
    
    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('获取划扣记录失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取划扣记录失败'
    });
  }
});

module.exports = router; 