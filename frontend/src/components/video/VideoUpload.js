import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  Divider,
  LinearProgress,
  Chip,
  Grid
} from '@mui/material';
import { CloudUpload, Movie, HighQuality } from '@mui/icons-material';
import { uploadVideo, getFullUrl } from '../../services/videoService';

const VideoUpload = () => {
  // 基本状态管理
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState(null);

  // refs
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // 当视频加载完成时获取视频信息
  const handleVideoLoad = () => {
    if (videoRef.current && selectedVideo) {
      const video = videoRef.current;
      setVideoInfo({
        duration: video.duration ? video.duration.toFixed(2) : '未知', // 秒
        width: video.videoWidth || '未知',
        height: video.videoHeight || '未知',
        size: (selectedVideo.size / (1024 * 1024)).toFixed(2), // MB
        name: selectedVideo.name,
        type: selectedVideo.type
      });
    }
  };

  // 处理视频文件选择
  const handleVideoChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('video/')) {
      setError('请选择有效的视频文件（MP4, WebM, MOV等）');
      return;
    }

    // 验证文件大小 (限制为100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('视频文件不能超过100MB');
      return;
    }

    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    setError('');
  };

  // 上传视频
  const handleUpload = async () => {
    if (!selectedVideo) {
      setError('请选择一个视频文件');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setUploadProgress(0);

      // 调用上传服务
      const response = await uploadVideo(
        selectedVideo, 
        selectedVideo.name,
        progress => setUploadProgress(progress)
      );

      console.log('上传成功:', response);
      setUploadSuccess(true);
      setUploadedVideo(response.video);
      
      // 3秒后导航回仪表盘
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('上传失败:', error);
      setError('视频上传失败: ' + (error.response?.data?.message || error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 构建视频预览URL
  const getVideoUrl = (path) => {
    // 打印处理前后的路径，便于调试
    console.log('处理前视频路径:', path);
    const url = getFullUrl(path);
    console.log('处理后视频URL:', url);
    return url;
  };

  // 格式化视频信息显示
  const formatVideoInfo = (video) => {
    return {
      name: video.oriVideoName || '未命名视频',
      size: `${video.oriVideoSize || 0} MB`,
      dimensions: video.oriVideoDim || '未知',
      duration: video.oriVideoDuration ? `${video.oriVideoDuration}秒` : '未知',
      frameRate: video.oriVideoFrameRate ? `${video.oriVideoFrameRate} fps` : '未知',
      codec: video.oriVideoCodec || '未知',
      frames: video.oriVideoFrameCnt || '未知'
    };
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          上传视频
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {uploadSuccess ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              视频上传成功！
            </Typography>
            
            {uploadedVideo && (
              <Box sx={{ mt: 4, mb: 4, textAlign: 'left' }}>
                <Card sx={{ maxWidth: 600, mx: 'auto', mb: 2 }}>
                  <CardMedia
                    component="video"
                    controls
                    src={getVideoUrl(uploadedVideo.oriVideoPath)}
                    sx={{ maxHeight: 300 }}
                  />
                </Card>
                
                <Paper sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    {uploadedVideo.oriVideoName}
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">大小：</Typography>
                      <Typography variant="body2">{uploadedVideo.oriVideoSize} MB</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">分辨率：</Typography>
                      <Typography variant="body2">{uploadedVideo.oriVideoDim}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">时长：</Typography>
                      <Typography variant="body2">{uploadedVideo.oriVideoDuration} 秒</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">帧率：</Typography>
                      <Typography variant="body2">{uploadedVideo.oriVideoFrameRate} fps</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">编码格式：</Typography>
                      <Typography variant="body2">{uploadedVideo.oriVideoCodec}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">总帧数：</Typography>
                      <Typography variant="body2">{uploadedVideo.oriVideoFrameCnt}</Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      icon={<HighQuality />} 
                      label={uploadedVideo.oriVideoCodec === 'h264' ? '高质量' : '标准质量'} 
                      color="primary" 
                      size="small" 
                    />
                  </Box>
                </Paper>
              </Box>
            )}
            
            <Typography variant="body1" color="textSecondary">
              正在返回仪表盘...
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                选择视频文件
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => videoInputRef.current.click()}
                  disabled={loading}
                >
                  选择视频
                </Button>
              </Box>

              <input
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                ref={videoInputRef}
                onChange={handleVideoChange}
              />

              {uploadProgress > 0 && loading && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    上传进度: {uploadProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}

              {videoPreview && (
                <Box sx={{ mt: 3 }}>
                  <Card sx={{ maxWidth: 600, mx: 'auto' }}>
                    <CardMedia
                      component="video"
                      controls
                      src={videoPreview}
                      sx={{ maxHeight: 300 }}
                      ref={videoRef}
                      onLoadedMetadata={handleVideoLoad}
                    />
                  </Card>
                  
                  {videoInfo && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Typography variant="body1" fontWeight="medium">
                        {videoInfo.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {videoInfo.width !== '未知' && videoInfo.height !== '未知' && 
                          `分辨率: ${videoInfo.width}x${videoInfo.height} • `}
                        {videoInfo.duration !== '未知' && `时长: ${videoInfo.duration}秒 • `}
                        大小: {videoInfo.size} MB
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleUpload}
                disabled={loading || !selectedVideo}
                startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <Movie />}
              >
                {loading ? '上传中...' : '上传视频'}
              </Button>
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            支持的格式: MP4, WebM, MOV, AVI 等 • 最大文件大小: 100MB
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default VideoUpload;
