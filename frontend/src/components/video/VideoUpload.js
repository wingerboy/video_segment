import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  Divider,
  LinearProgress,
  Chip,
  Grid,
  IconButton,
  TextField,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  Movie as MovieIcon, 
  HighQuality, 
  Clear as ClearIcon,
  Done as DoneIcon,
  Check as CheckIcon,
  Link as LinkIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { uploadVideo, getFullUrl, calculateMD5, getAllVideos } from '../../services/videoService';
import { UPLOAD_CONFIG } from '../../config';

// 自定义上传input样式
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// 视频预览区域样式
const PreviewBox = styled(Paper)(({ theme }) => ({
  width: '100%',
  height: 300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
}));

// 视频预览样式
const VideoPreview = styled('video')({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
});

// 清除按钮样式
const ClearButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  color: 'white',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
}));

const VideoUpload = ({ onUploadSuccess }) => {
  // 基本状态管理
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [videoName, setVideoName] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [fileHash, setFileHash] = useState('');
  const [videos, setVideos] = useState([]);
  const [isCheckingExistence, setIsCheckingExistence] = useState(false);
  
  // 消息提示状态
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // refs
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);

  // 加载视频库
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const videoList = await getAllVideos();
        setVideos(videoList);
      } catch (error) {
        console.error('加载视频库失败:', error);
      }
    };
    
    fetchVideos();
  }, []);

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

  // 验证文件
  const validateFile = (file) => {
    setFileError('');
    
    // 验证文件类型
    if (!file.type.startsWith('video/')) {
      setFileError('不支持的文件类型。请上传MP4, WebM, MOV等视频格式。');
      return false;
    }
    
    // 验证文件大小，使用配置中的值
    if (file.size > UPLOAD_CONFIG.MAX_VIDEO_SIZE) {
      setFileError(`文件大小超过限制。最大允许${UPLOAD_CONFIG.MAX_VIDEO_SIZE / (1024 * 1024)}MB。`);
      return false;
    }
    
    return true;
  };

  // 处理视频文件选择
  const handleVideoChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (validateFile(file)) {
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      
      // 使用文件名作为默认视频名称
      if (!videoName) {
        setVideoName(file.name.split('.')[0]);
      }
      
      // 计算文件MD5并检查是否已存在
      setIsCheckingExistence(true);
      setFileError('');
      
      try {
        const hash = await calculateMD5(file);
        setFileHash(hash);
        
        // 检查视频库中是否已存在相同MD5的视频
        const existingVideo = videos.find(v => 
          v.oriVideoMd5 === hash && v.oriVideoStatus === 'exists'
        );
        
        if (existingVideo) {
          setFileError(`视频库中已存在相同的视频（${existingVideo.oriVideoName || '未命名视频'}），请勿重复上传。`);
          console.log('发现重复视频:', existingVideo);
        }
      } catch (error) {
        console.error('计算MD5或检查视频存在性失败:', error);
      } finally {
        setIsCheckingExistence(false);
      }
    }
    
    // 重置文件输入以便重新选择相同文件
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };
  
  // 清除已选文件
  const handleClearFile = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedVideo(null);
    setVideoPreview('');
    setVideoInfo(null);
    setFileError('');
    setUploadProgress(0);
  };

  // 上传视频
  const handleUpload = async () => {
    // 表单验证
    if (!selectedVideo) {
      setFormError('请选择一个视频文件');
      return;
    }
    
    if (!videoName.trim()) {
      setFormError('请输入视频名称');
      return;
    }
    
    // 检查是否有文件错误（例如重复视频）
    if (fileError) {
      setSnackbar({
        open: true,
        message: fileError,
        severity: 'error'
      });
      return;
    }
    
    setFormError('');
    setUploadError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 调用上传服务
      const formData = new FormData();
      formData.append('video', selectedVideo);
      formData.append('name', videoName.trim());
      if (fileHash) {
        formData.append('md5Hash', fileHash);
      }
      
      const response = await uploadVideo(
        selectedVideo, 
        videoName.trim(),
        progress => setUploadProgress(progress)
      );

      console.log('上传成功:', response);
      
      if (response && response.video) {
        setUploadedVideo(response.video);
        
        // 回调通知父组件上传成功
        if (typeof onUploadSuccess === 'function') {
          onUploadSuccess(response.video);
        } else {
          // 否则显示成功对话框
          setSuccessDialogOpen(true);
        }
        
        // 重置表单
        handleClearFile();
        setVideoName('');
        setVideoDescription('');
      }
    } catch (error) {
      console.error('上传失败:', error);
      setUploadError('视频上传失败: ' + (error.response?.data?.message || error.message || '未知错误'));
      setSnackbar({
        open: true,
        message: `上传失败: ${error.message || '未知错误'}`,
        severity: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 关闭"上传成功"对话框
  const handleCloseSuccessDialog = () => {
    setSuccessDialogOpen(false);
  };

  // 获取视频URL
  const getVideoUrl = (video) => {
    // 如果传入的是对象，使用oriVideoUrlPath
    if (typeof video === 'object' && video !== null) {
      const path = video.oriVideoUrlPath || video.oriVideoPath;
      console.log('处理前视频对象路径:', path);
      const url = getFullUrl(path);
      console.log('处理后视频URL:', url);
      return url;
    }
    
    // 如果传入的是字符串路径
    console.log('处理前视频路径:', video);
    const url = getFullUrl(video);
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
    <Box sx={{ width: '100%' }}>
      {/* 上传表单 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* 文件选择区域 */}
          <PreviewBox>
            {videoPreview ? (
              <>
                <VideoPreview 
                  ref={videoRef}
                  src={videoPreview}
                  controls
                  onLoadedMetadata={handleVideoLoad}
                />
                <ClearButton onClick={handleClearFile}>
                  <ClearIcon />
                </ClearButton>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <MovieIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  选择视频文件
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  支持 {UPLOAD_CONFIG.VIDEO_FORMAT_SUPPORT_TEXT}，最大 {UPLOAD_CONFIG.MAX_VIDEO_SIZE / (1024 * 1024)}MB
                </Typography>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={isCheckingExistence ? <CircularProgress size={24} /> : <UploadIcon />}
                  sx={{ mt: 1 }}
                  disabled={isCheckingExistence}
                >
                  {isCheckingExistence ? '检查中...' : '选择视频'}
                  <VisuallyHiddenInput 
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    ref={videoInputRef}
                    disabled={isCheckingExistence}
                  />
                </Button>
              </Box>
            )}
          </PreviewBox>
          
          {fileError && (
            <Alert 
              severity="error" 
              sx={{ mt: 1, mb: 2 }}
              icon={<ErrorIcon />}
            >
              {fileError}
            </Alert>
          )}
          
          {selectedVideo && videoInfo && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                文件信息
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    文件名: {selectedVideo.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    大小: {videoInfo.size} MB
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    分辨率: {videoInfo.width}×{videoInfo.height}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    时长: {videoInfo.duration}秒
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          {/* 表单区域 */}
          <TextField
            fullWidth
            label="视频名称"
            value={videoName}
            onChange={(e) => setVideoName(e.target.value)}
            margin="normal"
            required
            error={formError === '请输入视频名称'}
            helperText={formError === '请输入视频名称' ? formError : ''}
          />
          
          <TextField
            fullWidth
            label="描述（可选）"
            value={videoDescription}
            onChange={(e) => setVideoDescription(e.target.value)}
            margin="normal"
            multiline
            rows={4}
          />
          
          {formError && formError !== '请输入视频名称' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}
          
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
              onClick={handleUpload}
              disabled={!selectedVideo || isUploading || !videoName.trim() || !!fileError || isCheckingExistence}
              fullWidth
            >
              {isUploading ? '上传中...' : '上传视频'}
            </Button>
          </Box>
          
          {isUploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ height: 8, borderRadius: 4 }} 
              />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {uploadProgress.toFixed(0)}%
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
      
      {/* 上传成功对话框 */}
      <Dialog
        open={successDialogOpen}
        onClose={handleCloseSuccessDialog}
        aria-labelledby="success-dialog-title"
      >
        <DialogTitle>上传成功</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              视频已成功上传
            </Typography>
            
            {uploadedVideo && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2, textAlign: 'left' }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Card>
                      <CardMedia
                        component="video"
                        sx={{ height: 120 }}
                        image={getVideoUrl(uploadedVideo)}
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="subtitle1">
                      {uploadedVideo.oriVideoName || '未命名视频'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      分辨率：{uploadedVideo.oriVideoDim || '未知'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      时长：{uploadedVideo.oriVideoDuration || '未知'} 秒
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      大小：{uploadedVideo.oriVideoSize || '未知'} MB
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessDialog}>
            关闭
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VideoUpload;
