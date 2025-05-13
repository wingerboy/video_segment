import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Person as PersonIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { AuthContext, UserEvents } from '../contexts/AuthContext';
import { searchUsers, getAgentTransfers, transferAccount } from '../services/accountService';
import { Navigate } from 'react-router-dom';

// 交易类型映射
const transactionTypeMap = {
  transfer: { label: '划扣', color: 'primary' }
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

// 自定义TabPanel组件
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AgentTransfer = () => {
  const { currentUser, updateUserBalance } = useContext(AuthContext);
  const [tabValue, setTabValue] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('代理划扣');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState('');
  
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // 加载划扣记录
  useEffect(() => {
    if (tabValue === 1) {
      fetchTransactions();
    }
  }, [tabValue]);

  // 检查用户是否为代理商
  if (currentUser && currentUser.role !== 'agent' && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // 获取划扣记录
  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const data = await getAgentTransfers();
      setTransactions(data);
      setTransactionsError('');
    } catch (error) {
      console.error('获取划扣记录失败:', error);
      setTransactionsError('获取划扣记录失败，请刷新页面重试');
    } finally {
      setTransactionsLoading(false);
    }
  };

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 处理搜索用户
  const handleSearch = async () => {
    if (!searchKeyword.trim() || searchKeyword.trim().length < 2) {
      setSearchError('请输入至少2个字符的搜索关键词');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError('');
      setSearchResults([]);
      setSelectedUser(null);
      
      const users = await searchUsers(searchKeyword);
      setSearchResults(users);
      
      if (users.length === 0) {
        setSearchError('未找到匹配的用户');
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
      setSearchError(error.message || '搜索用户失败');
    } finally {
      setSearchLoading(false);
    }
  };

  // 处理搜索框按回车
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 选择用户
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setTransferAmount('');
    setTransferError('');
    setTransferSuccess('');
  };

  // 处理打开确认对话框
  const handleOpenConfirmDialog = () => {
    // 验证划扣金额
    if (!transferAmount || isNaN(transferAmount) || parseFloat(transferAmount) <= 0) {
      setTransferError('请输入有效的划扣金额');
      return;
    }

    // 验证当前用户余额是否足够
    if (parseFloat(transferAmount) > parseFloat(currentUser.balance)) {
      setTransferError('您的账户余额不足');
      return;
    }

    setOpenConfirmDialog(true);
  };

  // 处理确认划扣
  const handleConfirmTransfer = async () => {
    if (!selectedUser || !transferAmount) {
      setTransferError('请选择用户并输入划扣金额');
      return;
    }

    try {
      setTransferLoading(true);
      setTransferError('');
      
      const description = transferDescription.trim() || '代理划扣';
      
      const result = await transferAccount(
        selectedUser.email,
        parseFloat(transferAmount),
        description
      );
      
      // 更新代理商余额
      if (result?.fromUser?.balance !== undefined) {
        updateUserBalance(result.fromUser.balance, 'agent_transfer');
      }
      
      // 更新所选用户以及搜索列表中的余额
      if (result?.toUser) {
        setSelectedUser(result.toUser);
        setSearchResults((prev) => prev.map(u => u.id === result.toUser.id ? result.toUser : u));
      }
      
      // 划扣成功
      setTransferSuccess(`成功向 ${selectedUser.username} (${selectedUser.email}) 划扣 ${transferAmount} 元`);
      setTransferAmount('');
      setTransferDescription('代理划扣');
      
      // 通知余额已更新
      UserEvents.emit(UserEvents.BALANCE_UPDATED, {
        userId: currentUser.id,
        source: 'agent_transfer'
      });
      
      // 关闭确认对话框
      setOpenConfirmDialog(false);
      
      // 如果当前是记录标签页，刷新记录
      if (tabValue === 1) {
        fetchTransactions();
      }
    } catch (error) {
      console.error('划扣失败:', error);
      setTransferError(error.message || '划扣失败，请重试');
      setOpenConfirmDialog(false);
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          代理划扣
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          您当前可用余额: <strong>{currentUser?.balance || 0} 元</strong>
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="agent transfer tabs"
          >
            <Tab label="划扣功能" />
            <Tab label="历史划扣" />
          </Tabs>
        </Box>

        {/* 划扣功能标签页 */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              搜索用户
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="输入用户名或邮箱"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                disabled={searchLoading}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={searchLoading}
                sx={{ minWidth: '120px' }}
              >
                {searchLoading ? <CircularProgress size={24} /> : '搜索'}
              </Button>
            </Box>
            {searchError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {searchError}
              </Alert>
            )}
          </Box>

          {/* 搜索结果列表 */}
          {searchResults.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                搜索结果
              </Typography>
              <List sx={{ bgcolor: 'background.paper' }}>
                {searchResults.map((user) => (
                  <ListItem
                    key={user.id}
                    alignItems="flex-start"
                    button
                    onClick={() => handleSelectUser(user)}
                    selected={selectedUser?.id === user.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {user.username} <Typography variant="caption">({user.email})</Typography>
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            余额: {user.balance} 元
                          </Typography>
                          <br />
                          <Typography variant="caption" component="span">
                            注册时间: {new Date(user.createdAt).toLocaleDateString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* 划扣表单 */}
          {selectedUser && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                划扣金额
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Typography variant="subtitle2">
                  已选择用户: {selectedUser.username} ({selectedUser.email})
                </Typography>
                <Typography variant="body2">
                  当前余额: {selectedUser.balance} 元
                </Typography>
              </Paper>
              <TextField
                fullWidth
                label="划扣金额"
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MonetizationOnIcon />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">元</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="交易描述"
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                placeholder="代理划扣"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenConfirmDialog}
                disabled={transferLoading || !transferAmount}
                fullWidth
              >
                {transferLoading ? <CircularProgress size={24} /> : '确认划扣'}
              </Button>
              {transferError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {transferError}
                </Alert>
              )}
              {transferSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {transferSuccess}
                </Alert>
              )}
            </Box>
          )}
        </TabPanel>

        {/* 历史划扣标签页 */}
        <TabPanel value={tabValue} index={1}>
          {transactionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : transactionsError ? (
            <Alert severity="error" sx={{ my: 2 }}>
              {transactionsError}
            </Alert>
          ) : transactions.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              暂无划扣记录
            </Alert>
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
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>{transaction.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            transactionTypeMap[transaction.transactionType]?.label ||
                            transaction.transactionType
                          }
                          color={
                            transactionTypeMap[transaction.transactionType]?.color ||
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{transaction.target || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{
                            color: 'error.main',
                            fontWeight: 'bold',
                          }}
                        >
                          -{transaction.amount}
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
        </TabPanel>
      </Paper>

      {/* 确认划扣对话框 */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>确认划扣</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要向 <strong>{selectedUser?.username} ({selectedUser?.email})</strong> 划扣 <strong>{transferAmount} 元</strong> 吗？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>取消</Button>
          <Button
            onClick={handleConfirmTransfer}
            variant="contained"
            disabled={transferLoading}
          >
            {transferLoading ? <CircularProgress size={24} /> : '确认'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AgentTransfer; 