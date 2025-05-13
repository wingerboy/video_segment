import React, { useState, useContext, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { AuthContext, UserEvents } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';

const Profile = () => {
  const { currentUser, logout, updateProfile, getCurrentUser } = useContext(AuthContext);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    balance: currentUser?.balance || 0
  });

  console.log('Profile Component - currentUser:', currentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 组件挂载时刷新用户信息
  useEffect(() => {
    // 刷新用户信息
    getCurrentUser();
    
    // 注册用户状态更新事件监听器
    const balanceSubscription = UserEvents.on(UserEvents.BALANCE_UPDATED, handleUserUpdated);
    const profileSubscription = UserEvents.on(UserEvents.PROFILE_UPDATED, handleUserUpdated);
    
    // 组件卸载时取消事件监听
    return () => {
      balanceSubscription();
      profileSubscription();
    };
  }, []);
  
  // 用户信息更新事件处理函数
  const handleUserUpdated = (data) => {
    console.log('Profile组件收到用户更新事件:', data);
    // 获取最新用户信息
    getCurrentUser();
  };
  
  // 当用户数据更新时更新表单数据
  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        balance: currentUser.balance || 0
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('资料更新成功');
      setEditMode(false);
    } catch (error) {
      setError(error.response?.data?.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Container maxWidth="sm">
        <Alert severity="error">请先登录</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          个人资料
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {editMode ? (
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="用户名"
                name="username"
                value={formData.username}
                onChange={handleChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="邮箱"
                name="email"
                type="email"
                value={formData.email}
                disabled
                margin="normal"
                helperText="邮箱不可更改"
              />
              <TextField
                fullWidth
                label="余额"
                name="balance"
                type="number"
                value={formData.balance}
                onChange={handleChange}
                margin="normal"
                disabled
              />
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : '保存'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setEditMode(false)}
                disabled={loading}
              >
                取消
              </Button>
            </Box>
          </form>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1"><strong>用户名:</strong> {currentUser.username}</Typography>
              <Typography variant="body1"><strong>邮箱:</strong> {currentUser.email}</Typography>
              <Typography variant="body1"><strong>余额:</strong> {currentUser.balance} 元</Typography>
              <Typography variant="body1"><strong>注册时间:</strong> {new Date(currentUser.createdAt).toLocaleString()}</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => setEditMode(true)}
              >
                编辑资料
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={logout}
              >
                退出登录
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Profile;
