import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  LinearProgress,
  TextField,
  Paper
} from '@mui/material';
import {
  Delete,
  MovieFilter,
  Visibility,
  CloudUpload
} from '@mui/icons-material';
import {
  getAllVideos,
  deleteVideo,
  uploadVideo
} from '../../services/videoService';
import { AuthContext } from '../../contexts/AuthContext';

import { API_BASE_URL } from '../../config';
import dayjs from 'dayjs';
import { DATE_SECOND_FORMAT } from '../../constants/index.ts';

const statusColors = {
  waiting: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error'
};

const statusTranslations = {
  waiting: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败'
};

const VideoList = () => {
  const { currentUser } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  
  // 视频上传相关状态
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoName, setVideoName] = useState('');
  const [showVideoUploadForm, setShowVideoUploadForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoInputRef = useRef(null);

  // 使用 useCallback 包装 fetchData
  const fetchData = useCallback(async () => {
    try {
      setError('');
      await fetchVideos();
    } catch (error) {
      setError('数据加载失败。请重试。');
      console.error('数据加载错误:', error);
    }
  }, []);

  // 页面加载时获取数据
  useEffect(() => {
    fetchData();

    // 每30秒自动刷新一次数据
    const intervalId = setInterval(fetchData, 30000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  // 获取视频列表
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await getAllVideos();
      // 确保videos是一个数组
      setVideos(Array.isArray(data) ? data : (data?.videos || []));
      return data;
    } catch (error) {
      console.error('获取视频列表失败:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 打开删除确认对话框
  const handleDeleteClick = (video) => {
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setVideoToDelete(null);
  };

  // 删除视频
  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    try {
      await deleteVideo(videoToDelete.id);
      setVideos(videos.filter(video => video.id !== videoToDelete.id));
      handleDeleteClose();
    } catch (error) {
      setError('删除视频失败。请重试。');
      console.error('删除视频错误:', error);
    }
  };

  // 上传视频到库
  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingVideo(true);
      setUploadProgress(0);
      setError('');

      // 如果没有设置名称，则使用文件名
      const name = videoName || file.name;

      // 使用修改后的uploadVideo函数，传入名称和进度回调
      await uploadVideo(file, name, (progress) => {
        setUploadProgress(progress);
      });

      await fetchVideos();
      setVideoName('');
      setShowVideoUploadForm(false);
      setUploadProgress(0);
    } catch (error) {
      setError('上传视频失败。请重试。');
      console.error('上传视频错误:', error);
    } finally {
      setUploadingVideo(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    return dayjs(dateString).format(DATE_SECOND_FORMAT);
  };

  // 获取视频缩略图
  const getVideoThumbnail = (video) => {
    return `${API_BASE_URL}/${video.oriVideoPath}`;
  };

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          视频库
        </Typography>
        
        {showVideoUploadForm ? (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant='h6' gutterBottom>
              上传视频到库
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
              <TextField
                label='视频名称（可选）'
                variant='outlined'
                fullWidth
                value={videoName}
                onChange={(e) => setVideoName(e.target.value)}
                disabled={uploadingVideo}
                sx={{ mr: 2 }}
              />
              <input
                type='file'
                accept='video/*'
                style={{ display: 'none' }}
                ref={videoInputRef}
                onChange={handleVideoUpload}
              />
              <Button
                variant='contained'
                color='primary'
                onClick={() => videoInputRef.current.click()}
                disabled={uploadingVideo}
                startIcon={
                  uploadingVideo ? (
                    <CircularProgress size={24} />
                  ) : (
                    <CloudUpload />
                  )
                }
              >
                {uploadingVideo ? '上传中...' : '选择并上传'}
              </Button>
            </Box>

            {uploadingVideo && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant='body2' sx={{ mb: 1 }}>
                  上传进度: {uploadProgress}%
                </Typography>
                <LinearProgress variant='determinate' value={uploadProgress} />
              </Box>
            )}

            <Typography variant='body2' color='textSecondary'>
              支持的格式: MP4, WebM, MOV, AVI 等。最大文件大小: 100MB
            </Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Button
              variant='contained'
              color='primary'
              onClick={() => setShowVideoUploadForm(true)}
              startIcon={<CloudUpload />}
            >
              上传视频
            </Button>
          </Box>
        )}

        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto' }} />
        ) : videos.length === 0 ? (
          <Alert severity='info'>
            您还没有上传任何视频。点击"上传视频"按钮开始上传。
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {videos.map((video) => (
              <Grid item xs={12} sm={6} md={4} key={video.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardActionArea component={Link} to={`/videos/${video.id}`}>
                    <CardMedia
                      component='video'
                      sx={{ height: 180 }}
                      image={getVideoThumbnail(video)}
                    />
                    <CardContent>
                      <Typography variant='h6' component='div' noWrap>
                        {video.oriVideoName || `视频 ${video.id}`}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 1
                        }}
                      >
                        <Chip
                          label={
                            statusTranslations[video.oriVideoStatus] || video.oriVideoStatus
                          }
                          color={statusColors[video.oriVideoStatus] || 'default'}
                          size='small'
                        />
                        <Typography variant='caption' color='text.secondary'>
                          {formatDate(video.createdAt)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                  <CardActions>
                    <Button
                      size='small'
                      startIcon={<Delete />}
                      color='error'
                      onClick={() => handleDeleteClick(video)}
                    >
                      删除
                    </Button>
                    <Button
                      size='small'
                      startIcon={<Visibility />}
                      component={Link}
                      to={`/videos/${video.id}`}
                    >
                      查看
                    </Button>
                    <Button
                      size='small'
                      startIcon={<MovieFilter />}
                      component={Link}
                      to={`/videos/${video.id}/process`}
                    >
                      分割
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* 删除确认对话框 */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
          <DialogTitle>确认删除</DialogTitle>
          <DialogContent>
            <DialogContentText>
              您确定要删除此视频吗？此操作无法撤销。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteClose}>取消</Button>
            <Button onClick={handleDeleteConfirm} color="error">
              删除
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default VideoList;
