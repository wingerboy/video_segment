import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { getTransactions } from '../services/accountService';

// 交易类型映射
const transactionTypeMap = {
  recharge: { label: '充值', color: 'success' },
  consume: { label: '消费', color: 'error' },
  refund: { label: '退款', color: 'info' },
  transfer: { label: '转账', color: 'warning' }
};

// 格式化日期函数
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const AccountTransactions = () => {
  const { currentUser } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 加载交易记录
  useEffect(() => {
    fetchTransactions();
  }, [transactionType]);

  // 过滤交易记录
  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm]);

  // 获取交易记录
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions(transactionType || null);
      setTransactions(data);
      setFilteredTransactions(data);
      setError('');
    } catch (error) {
      console.error('获取交易记录失败:', error);
      setError('获取交易记录失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  // 过滤交易记录
  const filterTransactions = () => {
    if (!searchTerm.trim()) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(transaction => 
      (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.target && transaction.target.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.interfaceAddress && transaction.interfaceAddress.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredTransactions(filtered);
  };

  // 处理交易类型变更
  const handleTypeChange = (event) => {
    setTransactionType(event.target.value);
  };

  // 处理搜索词变更
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          账户交易记录
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* 搜索和筛选工具栏 */}
        <Box sx={{ display: 'flex', mb: 3, gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="搜索交易记录"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            placeholder="搜索交易描述、交易对象..."
          />
          <FormControl sx={{ width: '200px' }}>
            <InputLabel>交易类型</InputLabel>
            <Select
              value={transactionType}
              onChange={handleTypeChange}
              label="交易类型"
              size="small"
            >
              <MenuItem value="">全部类型</MenuItem>
              <MenuItem value="recharge">充值</MenuItem>
              <MenuItem value="consume">消费</MenuItem>
              <MenuItem value="refund">退款</MenuItem>
              <MenuItem value="transfer">转账</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 交易记录表格 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : filteredTransactions.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>没有找到交易记录</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>账号</TableCell>
                  <TableCell>交易类型</TableCell>
                  <TableCell>交易对象</TableCell>
                  <TableCell align="right">金额 (元)</TableCell>
                  <TableCell>描述</TableCell>
                  <TableCell>交易时间</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>{transaction.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={transactionTypeMap[transaction.transactionType]?.label || transaction.transactionType} 
                        color={transactionTypeMap[transaction.transactionType]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{transaction.target || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography
                        sx={{
                          color: transaction.transactionType === 'consume' || 
                                (transaction.transactionType === 'transfer' && transaction.email === currentUser?.email) 
                                ? 'error.main' : 'success.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {transaction.transactionType === 'consume' || 
                         (transaction.transactionType === 'transfer' && transaction.email === currentUser?.email) 
                          ? `-${transaction.amount}` 
                          : `+${transaction.amount}`}
                      </Typography>
                    </TableCell>
                    <TableCell>{transaction.description || '-'}</TableCell>
                    <TableCell>{formatDate(transaction.transactionTime)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default AccountTransactions; 