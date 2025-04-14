const express = require('express');
const router = express.Router();
const { rechargeAccount, consumeAccount, refundAccount, getUserTransactions } = require('../services/accountService');
const { authenticate, isAdmin } = require('../middleware/auth');

/**
 * @api {get} /account/transactions 获取用户交易记录
 * @apiName GetUserTransactions
 * @apiGroup Account
 * @apiParam {String} [type] 交易类型过滤：recharge, consume, refund
 * @apiSuccess {Array} transactions 交易记录列表
 */
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;
    
    const transactions = await getUserTransactions(userId, type);
    
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
 * @apiParam {String} [externalTransactionId] 外部交易ID
 * @apiParam {String} [description] 交易描述
 * @apiSuccess {Object} transaction 交易记录
 * @apiSuccess {Object} user 更新后的用户信息
 */
router.post('/recharge', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, externalTransactionId, description } = req.body;
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的充值金额'
      });
    }
    
    const result = await rechargeAccount(
      userId, 
      parseFloat(amount), 
      externalTransactionId,
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
 * @apiParam {String} [description] 交易描述
 * @apiSuccess {Object} transaction 交易记录
 * @apiSuccess {Object} user 更新后的用户信息
 */
router.post('/consume', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, taskId, description } = req.body;
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的消费金额'
      });
    }
    
    const result = await consumeAccount(
      userId, 
      parseFloat(amount), 
      taskId,
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
 * @apiParam {Number} userId 用户ID (仅管理员可指定)
 * @apiParam {Number} amount 退款金额
 * @apiParam {Number} [taskId] 关联任务ID
 * @apiParam {String} [description] 交易描述
 * @apiSuccess {Object} transaction 交易记录
 * @apiSuccess {Object} user 更新后的用户信息
 */
router.post('/refund', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId, amount, taskId, description } = req.body;
    
    if (!userId || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID和退款金额'
      });
    }
    
    const result = await refundAccount(
      userId, 
      parseFloat(amount), 
      taskId,
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
 * @api {get} /account/admin/transactions/:userId 管理员获取指定用户交易记录
 * @apiName AdminGetUserTransactions
 * @apiGroup Account
 * @apiParam {String} userId 用户ID
 * @apiParam {String} [type] 交易类型过滤：recharge, consume, refund
 * @apiSuccess {Array} transactions 交易记录列表
 */
router.get('/admin/transactions/:userId', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID'
      });
    }
    
    const transactions = await getUserTransactions(userId, type);
    
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

module.exports = router; 