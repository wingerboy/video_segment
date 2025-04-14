import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  CloudDownload,
  Delete,
  Refresh,
  PhotoLibrary,
  Movie,
  CheckCircleOutline,
} from '@mui/icons-material';
import { getVideoById, uploadBackgroundImage, deleteVideo } from '../../services/videoService';

const statusColors = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error'
};

const statusTranslations = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败'
};

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const backgroundInputRef = useRef(null);
  
  // Polling interval for status updates (every 5 seconds)
  const POLLING_INTERVAL = 5000;
  let pollingTimer = null;
  
  // Fetch video details when component mounts
  useEffect(() => {
    fetchVideo();
    
    // Start polling if video is in pending or processing state
    startPolling();
    
    // Cleanup on unmount
    return () => {
      clearInterval(pollingTimer);
    };
  }, [id]);
  
  // Start polling for status updates
  const startPolling = () => {
    pollingTimer = setInterval(() => {
      if (video && (video.status === 'pending' || video.status === 'processing')) {
        fetchVideo(false);
      } else {
        clearInterval(pollingTimer);
      }
    }, POLLING_INTERVAL);
  };
  
  // Fetch video details from API
  const fetchVideo = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError('');
      const data = await getVideoById(id);
      setVideo(data);
      
      // Stop polling if video processing is complete or failed
      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(pollingTimer);
      }
    } catch (error) {
      setError('加载视频详情失败。请重试。');
      console.error('Error fetching video details:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };
  
  // Handle background image upload
  const handleBackgroundUpload = async (event) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    try {
      setUploadingBackground(true);
      setError('');
      
      await uploadBackgroundImage(id, file);
      
      // Refresh video data
      await fetchVideo(false);
      
      // Start polling for status updates
      startPolling();
    } catch (error) {
      setError('上传背景图片失败。请重试。');
      console.error('Error uploading background:', error);
    } finally {
      setUploadingBackground(false);
    }
  };
  
  // Handle video deletion
  const handleDelete = async () => {
    if (window.confirm('您确定要删除此视频吗？此操作无法撤销。')) {
      try {
        await deleteVideo(id);
        navigate('/dashboard');
      } catch (error) {
        setError('删除视频失败。请重试。');
        console.error('Error deleting video:', error);
      }
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!video) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">未找到视频或视频已被删除。</Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')} 
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            返回仪表盘
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard')} 
            startIcon={<ArrowBack />}
            sx={{ mr: 2 }}
          >
            返回
          </Button>
          <Typography variant="h4" component="h1">
            视频详情
          </Typography>
          <Chip 
            label={statusTranslations[video.status] || video.status}
            color={statusColors[video.status] || 'default'}
            sx={{ ml: 2 }}
          />
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          {/* Processing status */}
          {(video.status === 'pending' || video.status === 'processing') && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'center' }}>
              <CircularProgress size={30} sx={{ mb: 1 }} />
              <Typography variant="body1">
                {video.status === 'pending' ? '等待处理中...' : '正在处理您的视频...'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                这可能需要几分钟。页面将自动更新。
              </Typography>
            </Box>
          )}
          
          {/* Error status */}
          {video.status === 'failed' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              处理失败。请重新上传您的视频。
            </Alert>
          )}
          
          <Grid container spacing={4}>
            {/* Video display */}
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                {video.finalVideo ? '应用自定义背景的最终视频' : '原始视频'}
              </Typography>
              
              <Card sx={{ mb: 2 }}>
                <CardMedia
                  component="video"
                  controls
                  sx={{ width: '100%', maxHeight: '400px' }}
                  src={`http://localhost:5001/${video.finalVideo || video.originalVideo}`}
                />
              </Card>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudDownload />}
                  href={`http://localhost:5001/${video.finalVideo || video.originalVideo}`}
                  download
                  disabled={!video.finalVideo && !video.originalVideo}
                >
                  下载视频
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleDelete}
                >
                  删除
                </Button>
              </Box>
            </Grid>
            
            {/* Video info and background upload */}
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom>
                视频信息
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  上传于 {formatDate(video.createdAt)}
                </Typography>
                {video.updatedAt && video.updatedAt !== video.createdAt && (
                  <Typography variant="body2" color="text.secondary">
                    最后更新: {formatDate(video.updatedAt)}
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* Processing Status */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  处理步骤:
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleOutline color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2">原始视频已上传</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {video.extractedForeground ? (
                    <CheckCircleOutline color="success" sx={{ mr: 1 }} />
                  ) : video.status === 'processing' ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : (
                    <CheckCircleOutline color="disabled" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="body2">
                    前景提取 {video.extractedForeground ? '已完成' : video.status === 'processing' ? '进行中' : '待处理'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {video.finalVideo ? (
                    <CheckCircleOutline color="success" sx={{ mr: 1 }} />
                  ) : video.backgroundImage && video.status === 'processing' ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : (
                    <CheckCircleOutline color="disabled" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="body2">
                    背景替换 {video.finalVideo ? '已完成' : (video.backgroundImage && video.status === 'processing') ? '进行中' : '待处理'}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* Background Image Upload */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  自定义背景
                </Typography>
                
                {video.backgroundImage ? (
                  <Box>
                    <Card sx={{ mb: 2 }}>
                      <CardMedia
                        component="img"
                        sx={{ height: '200px', objectFit: 'contain' }}
                        image={`http://localhost:5001/${video.backgroundImage}`}
                        alt="背景图片"
                      />
                    </Card>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoLibrary />}
                      onClick={() => backgroundInputRef.current.click()}
                      disabled={uploadingBackground || video.status === 'processing'}
                      fullWidth
                    >
                      更换背景
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      尚未上传背景图片。上传图片来替换视频背景。
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoLibrary />}
                      onClick={() => backgroundInputRef.current.click()}
                      disabled={uploadingBackground || video.status === 'processing' || !video.extractedForeground}
                      fullWidth
                    >
                      {uploadingBackground ? <CircularProgress size={24} /> : '上传背景图片'}
                    </Button>
                    {!video.extractedForeground && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        请等待前景提取完成后再上传背景。
                      </Typography>
                    )}
                  </Box>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={backgroundInputRef}
                  onChange={handleBackgroundUpload}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default VideoDetail; 