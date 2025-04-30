import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon, 
  Visibility as VisibilityIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { getAllTasks, cancelTask } from '../../services/taskService';

// 状态颜色映射
const statusColors = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
  cancelled: 'default'
};

// 状态文本映射
const statusTranslations = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消'
};

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingTaskId, setCancellingTaskId] = useState(null);
  
  const navigate = useNavigate();

  // 页面加载时获取数据
  useEffect(() => {
    fetchTasks();
    
    // 每30秒自动刷新一次数据
    const intervalId = setInterval(() => {
      fetchTasks(true);
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // 获取任务列表
  const fetchTasks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = await getAllTasks();
      // 确保tasks是一个数组
      const taskList = Array.isArray(data) ? data : (data?.tasks || []);
      
      // 按创建时间排序，最新的排在前面
      setTasks(taskList.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ));
      
      setError('');
    } catch (error) {
      console.error('获取任务列表失败:', error);
      setError('获取任务列表失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 取消任务
  const handleCancelTask = async (taskId) => {
    try {
      setCancellingTaskId(taskId);
      await cancelTask(taskId);
      
      // 更新任务状态而不重新加载整个列表
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: 'cancelled' } 
          : task
      ));
      
    } catch (error) {
      console.error('取消任务失败:', error);
      setError('取消任务失败: ' + (error.message || '未知错误'));
    } finally {
      setCancellingTaskId(null);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未知时间';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };

  // 计算任务时长
  const getTaskDuration = (task) => {
    if (!task.createdAt || (!task.completedAt && task.status !== 'completed')) {
      return '进行中';
    }
    
    const start = new Date(task.createdAt);
    const end = task.completedAt ? new Date(task.completedAt) : new Date();
    const durationMs = end - start;
    
    // 转换为可读格式
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) return `${seconds}秒`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分钟`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}小时${remainingMinutes > 0 ? ` ${remainingMinutes}分钟` : ''}`;
  };

  // 任务状态显示
  const getStatusDisplay = (status) => {
    return (
      <Chip
        label={statusTranslations[status] || status}
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  // 任务进度显示
  const getTaskProgress = (task) => {
    let progress = 0;
    let statusText = '';
    
    switch (task.status) {
      case 'pending':
        progress = 0;
        statusText = '等待处理';
        break;
      case 'processing':
        progress = task.progress || 50;
        statusText = `处理中 ${progress}%`;
        break;
      case 'completed':
        progress = 100;
        statusText = '已完成';
        break;
      case 'failed':
        progress = 0;
        statusText = '处理失败';
        break;
      case 'cancelled':
        progress = 0;
        statusText = '已取消';
        break;
      default:
        statusText = task.status;
    }
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">{statusText}</Typography>
          {task.status === 'processing' && (
            <Typography variant="body2" color="text.secondary">{progress}%</Typography>
          )}
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          color={
            task.status === 'failed' ? 'error' : 
            task.status === 'cancelled' ? 'secondary' : 
            'primary'
          }
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>
    );
  };

  // 显示空状态
  if (loading && tasks.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* 标题和操作栏 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography variant="h4" component="h1">
            任务列表
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => fetchTasks(true)}
              startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
              disabled={refreshing}
            >
              {refreshing ? '刷新中...' : '刷新'}
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/segment')}
              startIcon={<AddIcon />}
            >
              创建任务
            </Button>
          </Box>
        </Box>

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 任务列表 */}
        {tasks.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2
          }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              暂无任务
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              创建一个视频处理任务开始使用吧！
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/segment')}
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              创建任务
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {tasks.map((task) => (
              <Grid item xs={12} md={6} key={task.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="div" noWrap title={task.videoName}>
                        {task.videoName || `任务 ${String(task.id).substring(0, 8)}`}
                      </Typography>
                      {getStatusDisplay(task.status)}
                    </Box>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          创建时间
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(task.createdAt)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          处理时长
                        </Typography>
                        <Typography variant="body2">
                          {getTaskDuration(task)}
                        </Typography>
                      </Grid>
                      
                      {task.modelId && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            使用模型
                          </Typography>
                          <Typography variant="body2">
                            {task.modelId === 'model1' ? '高精度模型' : 
                             task.modelId === 'model2' ? '标准模型' : 
                             task.modelId === 'model3' ? '快速模型' : 
                             task.modelId}
                          </Typography>
                        </Grid>
                      )}
                      
                      {task.videoId && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            视频ID
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {task.videoId}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                    
                    {getTaskProgress(task)}
                  </CardContent>
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      查看详情
                    </Button>
                    
                    <Box sx={{ flexGrow: 1 }} />
                    
                    {(task.status === 'pending' || task.status === 'processing') && (
                      <Tooltip title="取消任务">
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => handleCancelTask(task.id)}
                          disabled={cancellingTaskId === task.id}
                        >
                          {cancellingTaskId === task.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <CancelIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default TaskList; 