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
  Cancel as CancelIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  Loop as ProcessingIcon,
  CheckCircle as CompletedIcon,
  Error as FailedIcon,
  VideoCameraBack as VideoIcon,
  Wallpaper as BackgroundIcon,
  Settings as ModelIcon,
  Assignment as TaskIcon
} from '@mui/icons-material';
import { getAllTasks, cancelTask } from '../../services/taskService';
import { getFullUrl } from '../../services/videoService';

// 状态颜色映射
const statusColors = {
  waiting: 'warning',
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
  cancelled: 'default'
};

// 状态文本映射
const statusTranslations = {
  waiting: '等待中',
  pending: '等待中',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消'
};

// 状态图标映射
const statusIcons = {
  waiting: <ScheduleIcon fontSize="small" />,
  pending: <ScheduleIcon fontSize="small" />,
  processing: <ProcessingIcon fontSize="small" />,
  completed: <CompletedIcon fontSize="small" />,
  failed: <FailedIcon fontSize="small" />,
  cancelled: <CancelIcon fontSize="small" />
};

// 任务卡片组件
const TaskCard = ({ task, onCancel, isCancelling, formatDate, onDownloadResult }) => {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.2s',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: task.taskStatus === 'processing' ? '2px solid' : '1px solid',
        borderColor: task.taskStatus === 'processing' 
          ? 'info.main' 
          : 'divider',
        borderRadius: 2,
        overflow: 'visible',
        position: 'relative',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }
      }}
    >
      {/* 顶部进度条 */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {task.taskStatus === 'processing' ? '处理中' : task.taskStatus === 'waiting' ? '等待处理' : ''}
          </Typography>
          {task.taskStatus === 'processing' && (
            <Typography variant="body2" color="text.secondary">{task.taskProgress || 0}%</Typography>
          )}
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={
            task.taskStatus === 'completed' ? 100 :
            task.taskStatus === 'processing' ? (task.taskProgress || 0) :
            0
          } 
          color={
            task.taskStatus === 'failed' ? 'error' : 
            task.taskStatus === 'cancelled' ? 'secondary' : 
            task.taskStatus === 'processing' ? 'info' :
            task.taskStatus === 'completed' ? 'success' :
            'warning'
          }
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>
      
      <CardContent sx={{ pt: 1, pb: 2, position: 'relative' }}>
        {/* 任务标题和状态 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TaskIcon 
              sx={{ 
                mr: 1, 
                color: 
                  task.taskStatus === 'completed' ? 'success.main' : 
                  task.taskStatus === 'processing' ? 'info.main' : 
                  task.taskStatus === 'failed' ? 'error.main' : 
                  'warning.main'
              }} 
            />
            <Typography variant="h6" component="div" noWrap title={`任务ID: ${task.id}`}>
              任务 #{task.id}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {task.taskStatus === 'waiting' && (
              <IconButton 
                size="small"
                color="error"
                onClick={() => onCancel(task.id)}
                disabled={isCancelling}
                sx={{ mr: -1, mt: -1 }} // 调整位置更靠近右上角
                title="取消任务"
              >
                {isCancelling ? <CircularProgress size={18} /> : <CancelIcon fontSize="small" />}
              </IconButton>
            )}
            <Chip
              icon={statusIcons[task.taskStatus] || <ScheduleIcon fontSize="small" />}
              label={statusTranslations[task.taskStatus] || task.taskStatus}
              color={statusColors[task.taskStatus] || 'default'}
              size="small"
              sx={{ fontWeight: 'medium' }}
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 1.5 }} />
        
        {/* 任务详细信息 */}
        <Grid container spacing={2}>
          {/* 时间信息 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle2">时间信息</Typography>
            </Box>
            <Grid container spacing={1} sx={{ ml: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  创建时间
                </Typography>
                <Typography variant="body2" noWrap>
                  {formatDate(task.taskStartTime)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  {task.taskStatus === 'completed' || task.taskStatus === 'failed' || task.taskStatus === 'cancelled' 
                    ? '完成时间' 
                    : '更新时间'}
                </Typography>
                <Typography variant="body2" noWrap>
                  {formatDate(task.taskUpdateTime)}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          
          {/* 视频信息 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <VideoIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle2">视频信息</Typography>
            </Box>
            <Box sx={{ ml: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }} noWrap title={task.videoName || '未知视频'}>
                {task.videoName || '未知视频'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {task.videoDim ? `分辨率: ${task.videoDim}` : '分辨率: 未知'}
              </Typography>
            </Box>
          </Grid>
          
          {/* 背景信息 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <BackgroundIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle2">背景信息</Typography>
            </Box>
            <Box sx={{ ml: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }} noWrap title={task.backgroundName || '未知背景'}>
                {task.backgroundName || '未知背景'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {task.backgroundDim ? `分辨率: ${task.backgroundDim}` : '分辨率: 未知'}
              </Typography>
            </Box>
          </Grid>
          
          {/* 模型信息 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <ModelIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle2">模型信息</Typography>
            </Box>
            <Box sx={{ ml: 3 }}>
              <Typography variant="body2">
                {task.modelAlias}
                {!['normal', 'quick', 'slow'].includes(task.modelName) && task.modelName}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
      
      {/* 下载按钮，只有已完成且有输出路径的任务才显示 */}
      {task.taskStatus === 'completed' && task.outputVideoPath && (
        <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => onDownloadResult(task.outputVideoPath)}
          >
            下载结果
          </Button>
        </CardActions>
      )}
    </Card>
  );
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

  // 下载处理结果
  const handleDownloadResult = (outputPath) => {
    if (!outputPath) return;
    
    const fullUrl = getFullUrl(outputPath);
    window.open(fullUrl, '_blank');
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
                <TaskCard 
                  task={task} 
                  onCancel={handleCancelTask}
                  isCancelling={cancellingTaskId === task.id}
                  formatDate={formatDate}
                  onDownloadResult={handleDownloadResult}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default TaskList; 