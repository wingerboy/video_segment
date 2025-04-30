import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  CardMedia,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Movie as MovieIcon,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  VideoSettings as VideoSettingsIcon
} from '@mui/icons-material';
import { getTaskById, getTaskStatus, cancelTask } from '../../services/taskService';
import { getFullUrl } from '../../services/backgroundService';

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

// 模型ID映射
const modelNames = {
  model1: '高精度模型',
  model2: '标准模型',
  model3: '快速模型'
};

function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingTask, setCancellingTask] = useState(false);
  
  // 加载任务详情
  useEffect(() => {
    fetchTaskDetails();
    
    // 如果任务正在处理中，每10秒刷新一次状态
    const intervalId = task?.status === 'processing' ? 
      setInterval(() => refreshTaskStatus(), 10000) : null;
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, task?.status]);
  
  // 获取任务详情
  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const taskData = await getTaskById(id);
      if (taskData) {
        setTask(taskData);
      } else {
        setError('无法找到任务信息');
      }
    } catch (err) {
      console.error('获取任务详情失败:', err);
      setError('加载任务详情失败: ' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };
  
  // 刷新任务状态
  const refreshTaskStatus = async () => {
    try {
      setRefreshing(true);
      
      const statusData = await getTaskStatus(id);
      if (statusData) {
        setTask(prev => ({
          ...prev,
          status: statusData.status,
          progress: statusData.progress,
          message: statusData.message,
          outputPath: statusData.outputPath,
          completedAt: statusData.completedAt
        }));
      }
    } catch (err) {
      console.error('刷新任务状态失败:', err);
      // 不显示刷新错误，避免干扰用户
    } finally {
      setRefreshing(false);
    }
  };
  
  // 取消任务
  const handleCancelTask = async () => {
    try {
      setCancellingTask(true);
      
      await cancelTask(id);
      
      // 更新本地任务状态
      setTask(prev => ({
        ...prev,
        status: 'cancelled'
      }));
      
    } catch (err) {
      console.error('取消任务失败:', err);
      setError('无法取消任务: ' + (err.message || '未知错误'));
    } finally {
      setCancellingTask(false);
    }
  };
  
  // 返回任务列表
  const handleBackToList = () => {
    navigate('/tasks');
  };
  
  // 查看视频详情
  const handleViewVideo = () => {
    if (task?.videoId) {
      navigate(`/videos/${task.videoId}`);
    }
  };
  
  // 查看结果视频
  const handleViewResult = () => {
    if (task?.outputPath) {
      window.open(getFullUrl(task.outputPath), '_blank');
    }
  };
  
  // 下载结果视频
  const handleDownloadResult = () => {
    if (task?.outputPath) {
      const link = document.createElement('a');
      link.href = getFullUrl(task.outputPath);
      link.download = `processed_video_${id}.mp4`;
      link.click();
    }
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未知';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(dateString).toLocaleString('zh-CN', options);
  };
  
  // 计算任务持续时间
  const calculateDuration = () => {
    if (!task?.createdAt) return '未知';
    
    const startTime = new Date(task.createdAt);
    const endTime = task.completedAt ? new Date(task.completedAt) : new Date();
    
    const durationMs = endTime - startTime;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟 ${seconds % 60}秒`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时 ${minutes}分钟`;
  };
  
  // 获取任务状态显示
  const getStatusDisplay = () => {
    if (!task) return null;
    
    return (
      <Chip
        label={statusTranslations[task.status] || task.status}
        color={statusColors[task.status] || 'default'}
        sx={{ fontWeight: 'bold' }}
      />
    );
  };
  
  // 获取进度条显示
  const getProgressDisplay = () => {
    if (!task) return null;
    
    let progress = 0;
    let statusText = '';
    
    switch (task.status) {
      case 'pending':
        progress = 0;
        statusText = '等待处理';
        break;
      case 'processing':
        progress = task.progress || 50;
        statusText = `处理中: ${progress}%`;
        break;
      case 'completed':
        progress = 100;
        statusText = '处理完成';
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
          <Typography variant="body2" color="text.secondary">
            {statusText}
          </Typography>
          {task.status === 'processing' && (
            <Typography variant="body2" color="text.secondary">
              {progress}%
            </Typography>
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
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
    );
  };
  
  // 加载中状态
  if (loading && !task) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          py: 8, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}>
          <CircularProgress />
          <Typography>加载任务详情...</Typography>
        </Box>
      </Container>
    );
  }
  
  // 错误状态
  if (error && !task) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={fetchTaskDetails}>
                重试
              </Button>
            }
          >
            {error}
          </Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToList}
            sx={{ mt: 2 }}
          >
            返回任务列表
          </Button>
        </Box>
      </Container>
    );
  }
  
  // 主视图
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* 标题和操作栏 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleBackToList}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              任务详情
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={refreshTaskStatus}
              disabled={refreshing}
            >
              刷新状态
            </Button>
            
            {(task.status === 'pending' || task.status === 'processing') && (
              <Button
                variant="outlined"
                color="error"
                startIcon={cancellingTask ? <CircularProgress size={20} /> : <CancelIcon />}
                onClick={handleCancelTask}
                disabled={cancellingTask}
              >
                取消任务
              </Button>
            )}
          </Box>
        </Box>
        
        {/* 任务状态和信息 */}
        <Grid container spacing={3}>
          {/* 左侧：任务信息 */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5">
                  任务信息
                </Typography>
                {getStatusDisplay()}
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    任务ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {task.id}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    创建时间
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(task.createdAt)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    处理模型
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {modelNames[task.modelId] || task.modelId || '标准模型'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    处理时长
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {calculateDuration()}
                  </Typography>
                </Grid>
                
                {task.status === 'completed' && task.completedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      完成时间
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(task.completedAt)}
                    </Typography>
                  </Grid>
                )}
                
                {task.message && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      处理消息
                    </Typography>
                    <Typography 
                      variant="body1" 
                      gutterBottom
                      color={task.status === 'failed' ? 'error' : 'inherit'}
                    >
                      {task.message}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    处理进度
                  </Typography>
                  {getProgressDisplay()}
                </Grid>
              </Grid>
            </Paper>
            
            {/* 处理结果 */}
            {task.status === 'completed' && task.outputPath && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  处理结果
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ mb: 3 }}>
                  <video 
                    controls 
                    width="100%" 
                    style={{ borderRadius: 8, backgroundColor: '#000' }}
                    src={getFullUrl(task.outputPath)}
                    poster={task.thumbnailPath ? getFullUrl(task.thumbnailPath) : undefined}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={handleViewResult}
                  >
                    查看视频
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadResult}
                  >
                    下载视频
                  </Button>
                </Box>
              </Paper>
            )}
          </Grid>
          
          {/* 右侧：视频和背景信息 */}
          <Grid item xs={12} md={4}>
            {/* 原始视频信息 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <MovieIcon color="primary" />
                  <Typography variant="h6">原始视频</Typography>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {task.videoThumbnail ? (
                  <CardMedia
                    component="img"
                    height="160"
                    image={getFullUrl(task.videoThumbnail)}
                    alt="视频缩略图"
                    sx={{ borderRadius: 1, mb: 2, objectFit: 'cover' }}
                  />
                ) : (
                  <Box 
                    sx={{
                      height: 160,
                      bgcolor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                      mb: 2
                    }}
                  >
                    <VideoSettingsIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  </Box>
                )}
                
                <Typography variant="body1" gutterBottom noWrap>
                  {task.videoName || '未命名视频'}
                </Typography>
                
                {task.videoDuration && (
                  <Typography variant="body2" color="text.secondary">
                    时长: {task.videoDuration}秒
                  </Typography>
                )}
                
                {task.videoDimensions && (
                  <Typography variant="body2" color="text.secondary">
                    分辨率: {task.videoDimensions}
                  </Typography>
                )}
                
                <Button
                  size="small"
                  startIcon={<MovieIcon />}
                  onClick={handleViewVideo}
                  sx={{ mt: 2 }}
                >
                  查看视频详情
                </Button>
              </CardContent>
            </Card>
            
            {/* 背景图信息 */}
            {task.backgroundId && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ImageIcon color="primary" />
                    <Typography variant="h6">背景图片</Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {task.backgroundUrl ? (
                    <CardMedia
                      component="img"
                      height="160"
                      image={getFullUrl(task.backgroundUrl)}
                      alt="背景图片"
                      sx={{ borderRadius: 1, mb: 2, objectFit: 'cover' }}
                    />
                  ) : (
                    <Box 
                      sx={{
                        height: 160,
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        mb: 2
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    </Box>
                  )}
                  
                  <Typography variant="body1" gutterBottom noWrap>
                    {task.backgroundName || '未命名背景'}
                  </Typography>
                  
                  <Button
                    size="small"
                    startIcon={<ImageIcon />}
                    onClick={() => navigate(`/backgrounds/${task.backgroundId}`)}
                    sx={{ mt: 2 }}
                  >
                    查看背景详情
                  </Button>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default TaskDetails; 