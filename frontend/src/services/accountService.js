import axios from 'axios';
import { API_URL, AUTH_CONFIG } from '../config';

/**
 * 设置请求头中的认证令牌
 * @param {string} token - JWT认证令牌
 */
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

/**
 * 获取用户账户交易记录
 * @param {string} [type] - 可选的交易类型过滤
 * @returns {Promise<Array>} 交易记录列表
 */
const getTransactions = async (type = null) => {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    setAuthToken(token);

    const url = type 
      ? `${API_URL}/account/transactions?type=${type}` 
      : `${API_URL}/account/transactions`;
    
    const response = await axios.get(url);
    return response.data.data;
  } catch (error) {
    console.error('获取交易记录失败:', error);
    throw error.response?.data || { message: '获取交易记录失败' };
  }
};

/**
 * 充值账户余额
 * @param {number} amount - 充值金额
 * @param {string} [externalTransactionId] - 外部交易ID
 * @param {string} [description] - 交易描述
 * @returns {Promise<Object>} 充值结果，包含交易记录和更新后的用户信息
 */
const rechargeAccount = async (amount, externalTransactionId = null, description = null) => {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    setAuthToken(token);

    const payload = {
      amount: parseFloat(amount),
      externalTransactionId,
      description
    };

    const response = await axios.post(`${API_URL}/account/recharge`, payload);
    return response.data.data;
  } catch (error) {
    console.error('账户充值失败:', error);
    throw error.response?.data || { message: '账户充值失败' };
  }
};

/**
 * 从账户消费
 * @param {number} amount - 消费金额
 * @param {number} [taskId] - 关联任务ID
 * @param {string} [description] - 交易描述
 * @returns {Promise<Object>} 消费结果，包含交易记录和更新后的用户信息
 */
const consumeAccount = async (amount, taskId = null, description = null) => {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    setAuthToken(token);

    const payload = {
      amount: parseFloat(amount),
      taskId,
      description
    };

    const response = await axios.post(`${API_URL}/account/consume`, payload);
    return response.data.data;
  } catch (error) {
    console.error('账户消费失败:', error);
    throw error.response?.data || { message: '账户消费失败' };
  }
};

/**
 * 管理员功能：为用户退款
 * @param {number} userId - 用户ID
 * @param {number} amount - 退款金额
 * @param {number} [taskId] - 关联任务ID
 * @param {string} [description] - 交易描述
 * @returns {Promise<Object>} 退款结果，包含交易记录和更新后的用户信息
 */
const refundAccount = async (userId, amount, taskId = null, description = null) => {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    setAuthToken(token);

    const payload = {
      userId,
      amount: parseFloat(amount),
      taskId,
      description
    };

    const response = await axios.post(`${API_URL}/account/refund`, payload);
    return response.data.data;
  } catch (error) {
    console.error('账户退款失败:', error);
    throw error.response?.data || { message: '账户退款失败' };
  }
};

/**
 * 管理员功能：获取特定用户的交易记录
 * @param {number} userId - 用户ID
 * @param {string} [type] - 可选的交易类型过滤
 * @returns {Promise<Array>} 交易记录列表
 */
const getUserTransactions = async (userId, type = null) => {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    setAuthToken(token);

    const url = type 
      ? `${API_URL}/account/admin/transactions/${userId}?type=${type}` 
      : `${API_URL}/account/admin/transactions/${userId}`;
    
    const response = await axios.get(url);
    return response.data.data;
  } catch (error) {
    console.error('获取用户交易记录失败:', error);
    throw error.response?.data || { message: '获取用户交易记录失败' };
  }
};

/**
 * 代理商查找用户
 * @param {string} keyword - 搜索关键词，用于搜索用户名或邮箱
 * @returns {Promise<Array>} 匹配的用户列表
 */
const searchUsers = async (keyword) => {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    setAuthToken(token);

    const response = await axios.get(`${API_URL}/account/search-users?keyword=${encodeURIComponent(keyword)}`);
    return response.data.data;
  } catch (error) {
    console.error('查找用户失败:', error);
    throw error.response?.data || { message: '查找用户失败' };
  }
};

/**
 * 代理商获取划扣记录
 * @returns {Promise<Array>} 划扣记录列表
 */
const getAgentTransfers = async () => {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    setAuthToken(token);

    const response = await axios.get(`${API_URL}/account/agent-transfers`);
    return response.data.data;
  } catch (error) {
    console.error('获取划扣记录失败:', error);
    throw error.response?.data || { message: '获取划扣记录失败' };
  }
};

/**
 * 向其他用户账户转账（或代理划扣）
 * @param {string} toEmail - 接收方用户邮箱
 * @param {number} amount - 转账金额
 * @param {string} [description] - 交易描述
 * @returns {Promise<Object>} 转账结果
 */
const transferAccount = async (toEmail, amount, description = null) => {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    setAuthToken(token);

    const payload = {
      toEmail,
      amount: parseFloat(amount),
      description
    };

    const response = await axios.post(`${API_URL}/account/transfer`, payload);
    return response.data.data;
  } catch (error) {
    console.error('账户转账失败:', error);
    throw error.response?.data || { message: '账户转账失败' };
  }
};

export {
  getTransactions,
  rechargeAccount,
  consumeAccount,
  refundAccount,
  getUserTransactions,
  searchUsers,
  getAgentTransfers,
  transferAccount,
  setAuthToken
};