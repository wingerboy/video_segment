import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardMedia
} from '@mui/material';
import {
  CheckCircleOutline,
  Delete,
  ArrowBack
} from '@mui/icons-material';
import { getVideoById, deleteVideo } from '../../services/videoService';
import { API_BASE_URL } from '../../config';
import moment from 'moment';
import 'moment/locale/zh-cn';  // 导入中文语言包

// 设置moment为中文
moment.locale('zh-cn');

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // 定时获取视频信息的间隔（毫秒）
  const POLLING_INTERVAL = 5000;
  let pollingInterval = useRef(null);
  
  // 获取视频信息
  const fetchVideo = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const response = await getVideoById(id);
      const videoData = response.video;
      
      setVideo(videoData);
      
      // 如果视频正在处理中，启动轮询
      if (videoData.oriVideoStatus === 'processing') {
        startPolling();
      } else if (pollingInterval.current) {
        // 如果视频不再处理中，停止轮询
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    } catch (error) {
      setError('获取视频详情失败：' + (error.response?.data?.message || error.message || '未知错误'));
      console.error('获取视频详情失败:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [id]);
  
  // 启动轮询
  const startPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    pollingInterval.current = setInterval(() => {
      fetchVideo(false);
    }, POLLING_INTERVAL);
  }, [fetchVideo]);
  
  useEffect(() => {
    fetchVideo();
    
    // 清理函数
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [fetchVideo]);
  
  // 删除视频
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteVideo(id);
      setDeleteDialogOpen(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('删除视频失败:', error);
      setError('删除视频失败: ' + (error.response?.data?.message || error.message || '未知错误'));
    } finally {
      setDeleting(false);
    }
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    return moment(dateString).format('YYYY-MM-DD HH:mm');
  };
  
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Box sx={{ mt: 5 }}>
          <Typography color="error" gutterBottom>{error}</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            返回仪表盘
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!video) {
    return (
      <Container>
        <Box sx={{ mt: 5 }}>
          <Typography gutterBottom>视频不存在或已被删除</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            返回仪表盘
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
        >
          返回仪表盘
        </Button>
        
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {video.oriVideoName || `视频 #${id}`}
            </Typography>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              删除视频
            </Button>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              {/* Video Player */}
              <Card elevation={0} sx={{ mb: 3 }}>
                <CardMedia
                  component="video"
                  controls
                  sx={{ width: '100%', maxHeight: '500px' }}
                  image={`${API_BASE_URL}/${video.oriVideoPath}`}
                />
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              {/* Video info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  视频信息
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>上传时间:</strong> {formatDate(video.createdAt)}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>视频大小:</strong> {video.oriVideoSize} MB
                </Typography>
                
                {video.oriVideoDim && (
                  <Typography variant="body2" gutterBottom>
                    <strong>视频尺寸:</strong> {video.oriVideoDim}
                  </Typography>
                )}
                
                <Typography variant="body2" gutterBottom>
                  <strong>使用次数:</strong> {video.oriVideoUsageCnt || 0}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>状态:</strong> {video.oriVideoStatus === 'exists' ? '可用' : video.oriVideoStatus}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* Processing Status */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  处理状态
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {video.foreVideoPath ? (
                    <CheckCircleOutline color="success" sx={{ mr: 1 }} />
                  ) : video.oriVideoStatus === 'processing' ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : (
                    <CheckCircleOutline color="disabled" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="body2">
                    前景提取 {video.foreVideoPath ? '已完成' : video.oriVideoStatus === 'processing' ? '进行中' : '待处理'}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  您可以创建任务对视频进行进一步处理。
                </Typography>
              </Box>
              
              {/* 任务按钮 */}
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={() => navigate(`/videos/${id}/process`)}
              >
                创建处理任务
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除这个视频吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            取消
          </Button>
          <Button onClick={handleDelete} color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={24} /> : '删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VideoDetail;