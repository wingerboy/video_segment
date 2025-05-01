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

// 背景组件
import BackgroundList from './components/backgrounds/BackgroundList';
import BackgroundDetail from './components/backgrounds/BackgroundDetail';
import BackgroundUpload from './components/backgrounds/BackgroundUpload';

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

// 私有路由组件
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              {/* 由于路由优先级问题，单独列出/segment路由 */}
              <Route path="/segment" element={<CreateTask />} />
              
              {/* 其他认证路由 */}
              {authenticatedRoutes.filter(route => route.path !== '/segment').map((route, index) => (
                <Route key={index} path={route.path} element={route.element} />
              ))}
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
