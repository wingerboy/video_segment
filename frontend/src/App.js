import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Layout Components
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Video Components
import VideoList from './components/video/VideoList';
import VideoUpload from './components/video/VideoUpload';
import VideoDetail from './components/video/VideoDetail';
import NotFound from './components/layout/NotFound';
import Profile from './components/auth/Profile';
import Dashboard from './pages/Dashboard';
import CreateTask from './pages/CreateTask';
import TaskList from './components/tasks/TaskList';
import TaskDetails from './components/tasks/TaskDetails';
import UserManagement from './pages/UserManagement';
import AIServiceManagement from './pages/AIServiceManagement';
import TaskManagement from './pages/TaskManagement';
import AccountTransactions from './pages/AccountTransactions';
import AgentTransfer from './pages/AgentTransfer';

// 背景组件
import BackgroundList from './components/backgrounds/BackgroundList';
import BackgroundDetail from './components/backgrounds/BackgroundDetail';
import BackgroundUpload from './components/backgrounds/BackgroundUpload';

// 路由组件
import PrivateRoute from './routes/PrivateRoute';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

// 定义需要认证的路由
const authenticatedRoutes = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/segment', element: <CreateTask /> },
  { path: '/videos/upload', element: <VideoUpload /> },
  { path: '/tasks/create', element: <CreateTask /> },
  { path: '/videos/:id', element: <VideoDetail /> },
  { path: '/tasks/:id', element: <TaskDetails /> },
  // 背景路由 - 注意路径优先级顺序
  { path: '/backgrounds/upload', element: <BackgroundUpload /> },
  { path: '/backgrounds/:id', element: <BackgroundDetail /> },
  { path: '/backgrounds', element: <BackgroundList /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> }
];

// 布局组件
const Layout = () => {
  return (
    <>
      <Navbar />
      <Box sx={{ pt: 8, pb: 4 }}>
        <Outlet />
      </Box>
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 使用Layout包装需要导航栏的路由 */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<PrivateRoute component={Dashboard} />} />
              <Route path="/profile" element={<PrivateRoute component={Profile} />} />
              <Route path="/segment" element={<PrivateRoute component={CreateTask} />} />
              <Route path="/user-management" element={<PrivateRoute component={UserManagement} isAdmin={true} />} />
              <Route path="/ai-service-management" element={<PrivateRoute component={AIServiceManagement} isAdmin={true} />} />
              <Route path="/task-management" element={<PrivateRoute component={TaskManagement} isAdmin={true} />} />
              <Route path="/account-transactions" element={<PrivateRoute component={AccountTransactions} />} />
              <Route path="/agent-transfer" element={<PrivateRoute component={AgentTransfer} isAgent={true} />} />
              
              {/* 其他认证路由 */}
              {authenticatedRoutes.filter(route => route.path !== '/segment').map((route, index) => (
                <Route 
                  key={index} 
                  path={route.path} 
                  element={<PrivateRoute component={() => route.element} />} 
                />
              ))}
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
