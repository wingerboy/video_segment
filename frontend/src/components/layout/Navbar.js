import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Snackbar,
  Alert
} from '@mui/material';
import { AccountCircle, VideoLibrary } from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_URL, AUTH_CONFIG, ENV_CONFIG } from '../../config';

const Navbar = () => {
  const { currentUser, logout, getCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  // 开发环境下设置当前用户为管理员
  const handleSetAdmin = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/set-admin`);
      
      if (response.data && response.data.token) {
        // 保存新token和用户信息
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
        localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(response.data.user));
        
        // 刷新用户信息
        await getCurrentUser();
        
        // 显示成功消息
        setSnackbar({
          open: true,
          message: '已成功设置为管理员，请刷新页面查看效果',
          severity: 'success'
        });
      }
      
      // 关闭菜单
      handleClose();
    } catch (error) {
      console.error('设置管理员失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '设置管理员失败',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // 检查是否为开发环境
  const isDevelopment = ENV_CONFIG.IS_DEVELOPMENT;

  return (
    <>
      <AppBar position="static">
        <Container maxWidth="lg">
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <VideoLibrary sx={{ mr: 1 }} />
              <Typography
                variant="h6"
                component={Link}
                to="/"
                sx={{ textDecoration: 'none', color: 'inherit' }}
              >
                视频分割
              </Typography>
            </Box>

            {currentUser ? (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/dashboard"
                  sx={{ mx: 1 }}
                >
                  仪表盘
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/segment')}
                  sx={{ mx: 1 }}
                >
                  视频分割
                </Button>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                    {currentUser.username.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem component={Link} to="/profile" onClick={handleClose}>
                    个人资料
                  </MenuItem>
                  <MenuItem component={Link} to="/account-transactions" onClick={handleClose}>
                    账户流水
                  </MenuItem>
                  {currentUser.role === 'agent' && (
                    <MenuItem component={Link} to="/agent-transfer" onClick={handleClose}>
                      代理划扣
                    </MenuItem>
                  )}
                  {currentUser.role === 'admin' && (
                    [
                      <MenuItem key="user-management" component={Link} to="/user-management" onClick={handleClose}>
                        账号管理
                      </MenuItem>,
                      <MenuItem key="ai-service-management" component={Link} to="/ai-service-management" onClick={handleClose}>
                        AI服务管理
                      </MenuItem>,
                      <MenuItem key="task-management" component={Link} to="/task-management" onClick={handleClose}>
                        任务管理
                      </MenuItem>
                    ]
                  )}
                  {isDevelopment && currentUser.role !== 'admin' && currentUser.email === 'wingerliu2019@gmail.com' && (
                    [
                      <MenuItem key="set-admin" onClick={handleSetAdmin}>
                        设为管理员 (开发)
                      </MenuItem>
                    ]
                  )}
                  <MenuItem onClick={handleLogout}>退出登录</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} to="/login">
                  登录
                </Button>
                <Button color="inherit" component={Link} to="/register">
                  注册
                </Button>
              </>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Navbar;
