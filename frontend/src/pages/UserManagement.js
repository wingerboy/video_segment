import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import { 
  Edit as EditIcon, 
  AccountBalance as BalanceIcon, 
  Block as BlockIcon,
  Check as CheckIcon, 
  Search as SearchIcon 
} from '@mui/icons-material';
import { getAllUsers, updateUserStatus, updateUserRole, rechargeAccount } from '../services/adminService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // 对话框状态
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openRechargeDialog, setOpenRechargeDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // 编辑用户表单数据
  const [editFormData, setEditFormData] = useState({
    role: '',
    userStatus: ''
  });
  
  // 充值表单数据
  const [rechargeFormData, setRechargeFormData] = useState({
    amount: '',
    description: ''
  });

  // 加载用户数据
  useEffect(() => {
    fetchUsers();
  }, []);

  // 过滤用户数据
  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, tabValue]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setError('');
    } catch (error) {
      setError('获取用户数据失败，请重试');
      console.error('获取用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 按选项卡过滤
    switch(tabValue) {
      case 1: // 管理员
        filtered = filtered.filter(user => user.role === 'admin');
        break;
      case 2: // 代理商
        filtered = filtered.filter(user => user.role === 'agent');
        break;
      case 3: // 已禁用
        filtered = filtered.filter(user => user.userStatus === 'banned');
        break;
      case 4: // 正常用户
        filtered = filtered.filter(user => user.role === 'user' && user.userStatus === 'active');
        break;
      default: // 所有用户
        break;
    }
    
    setFilteredUsers(filtered);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      role: user.role,
      userStatus: user.userStatus
    });
    setOpenEditDialog(true);
  };

  const handleRechargeUser = (user) => {
    setSelectedUser(user);
    setRechargeFormData({
      amount: '',
      description: `管理员手动充值 - ${new Date().toLocaleDateString()}`
    });
    setOpenRechargeDialog(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRechargeFormChange = (e) => {
    const { name, value } = e.target;
    setRechargeFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitEdit = async () => {
    try {
      setLoading(true);
      
      // 更新用户角色
      if (editFormData.role !== selectedUser.role) {
        await updateUserRole(selectedUser.id, editFormData.role);
      }
      
      // 更新用户状态
      if (editFormData.userStatus !== selectedUser.userStatus) {
        await updateUserStatus(selectedUser.id, editFormData.userStatus);
      }
      
      // 刷新数据
      await fetchUsers();
      setOpenEditDialog(false);
    } catch (error) {
      setError('更新用户失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRecharge = async () => {
    try {
      setLoading(true);
      
      const amount = parseFloat(rechargeFormData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('请输入有效的充值金额');
        return;
      }
      
      await rechargeAccount(
        selectedUser.id, 
        amount, 
        null, 
        rechargeFormData.description
      );
      
      // 刷新数据
      await fetchUsers();
      setOpenRechargeDialog(false);
    } catch (error) {
      setError('充值失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return '管理员';
      case 'user': return '普通用户';
      case 'agent': return '代理商';
      default: return role;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return '正常';
      case 'banned': return '禁用';
      case 'pending': return '待审核';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'banned': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          账号管理
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="用户筛选选项卡">
            <Tab label="所有用户" />
            <Tab label="管理员" />
            <Tab label="代理商" />
            <Tab label="已禁用用户" />
            <Tab label="普通用户" />
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="搜索用户名或邮箱"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="outlined" 
            onClick={fetchUsers}
          >
            刷新
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>用户名</TableCell>
                  <TableCell>邮箱</TableCell>
                  <TableCell>角色</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell align="right">账户余额</TableCell>
                  <TableCell>注册时间</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} sx={{ my: 3 }} />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleLabel(user.role)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(user.userStatus)} 
                          color={getStatusColor(user.userStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">¥{(parseFloat(user.balance) || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString() 
                          : '无记录'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditUser(user)}
                          color="primary"
                          title="编辑用户"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleRechargeUser(user)}
                          color="success"
                          title="账户充值"
                        >
                          <BalanceIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* 编辑用户对话框 */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑用户</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box component="form" sx={{ mt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedUser.username} ({selectedUser.email})
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>角色</InputLabel>
                <Select
                  name="role"
                  value={editFormData.role}
                  onChange={handleEditFormChange}
                  label="角色"
                >
                  <MenuItem value="user">普通用户</MenuItem>
                  <MenuItem value="admin">管理员</MenuItem>
                  <MenuItem value="agent">代理商</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>状态</InputLabel>
                <Select
                  name="userStatus"
                  value={editFormData.userStatus}
                  onChange={handleEditFormChange}
                  label="状态"
                >
                  <MenuItem value="active">正常</MenuItem>
                  <MenuItem value="banned">禁用</MenuItem>
                  <MenuItem value="pending">待审核</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>取消</Button>
          <Button 
            onClick={handleSubmitEdit} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 充值对话框 */}
      <Dialog open={openRechargeDialog} onClose={() => setOpenRechargeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>账户充值</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box component="form" sx={{ mt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedUser.username} ({selectedUser.email})
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                当前余额: ¥{(parseFloat(selectedUser.balance) || 0).toFixed(2)}
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                label="充值金额"
                name="amount"
                value={rechargeFormData.amount}
                onChange={handleRechargeFormChange}
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                }}
              />
              
              <TextField
                margin="normal"
                fullWidth
                label="充值说明"
                name="description"
                value={rechargeFormData.description}
                onChange={handleRechargeFormChange}
                multiline
                rows={2}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRechargeDialog(false)}>取消</Button>
          <Button 
            onClick={handleSubmitRecharge} 
            variant="contained"
            disabled={loading || !rechargeFormData.amount}
            color="success"
          >
            {loading ? <CircularProgress size={24} /> : '确认充值'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement; 