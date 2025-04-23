import React, { useState, useRef, useEffect, useContext, use } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
  Card,
  CardMedia,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  CardContent,
  Divider
} from '@mui/material';
import { CloudUpload, Wallpaper } from '@mui/icons-material';
import { uploadVideo, uploadBackgroundImage, startVideoSegmentation, createTask, createTaskV2, getAllBackgrounds, getAllVideos } from '../../services/videoService';
import { API_BASE_URL } from '../../config';
// 在组件顶部导入 hook
import { useScrollToError } from '../../hooks/useScrollToError';


import { AuthContext } from '../../contexts/AuthContext';

// 可用的分割模型
const segmentationModels = [
  { id: 'slow', name: '高精度模型（慢）', description: '准确度高，适合精细分割，处理时间较长' },
  { id: 'normal', name: '标准模型（推荐）', description: '准确度和速度的平衡选择，适合大多数视频' },
  { id: 'quick', name: '快速模型（快）', description: '处理速度快，精度较低，适合简单场景' }
];


// 在组件内部使用
const VideoUpload = () => {
  const { currentUser } = useContext(AuthContext);
  const [selectedVideo, setSelectedVideo] = useState();
  const [selectedBackground, setSelectedBackground] = useState();
  const [videoPreview, setVideoPreview] = useState('');
  const [backgroundPreview, setBackgroundPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoId, setVideoId] = useState();
  const [bgId, setBGid] = useState();
  const [applyBackground, setApplyBackground] = useState(true);
  const [videoInfo, setVideoInfo] = useState();
  const [selectedModel, setSelectedModel] = useState('normal');
  const [taskCreated, setTaskCreated] = useState(false);
  const [backgrounds, setBackgrounds] = useState([]);
  const [videos, setVideos] = useState([]);
  const [backgroundsLoading, setBackgroundsLoading] = useState(false);
  const [videosLoading, setVideosLoading] = useState(false);
  const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);

  const errorRef = useScrollToError(error)
  const videoInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // 加载背景库和视频库
  useEffect(() => {
    fetchBackgrounds();
    fetchVideos();
  }, []);

  // 当视频加载完成时获取视频信息
  useEffect(() => {
    if (videoRef.current && videoPreview) {
      videoRef.current.onloadedmetadata = () => {
        const video = videoRef.current;
        setVideoInfo({
          duration: video.duration.toFixed(2), // 秒
          width: video.videoWidth,
          height: video.videoHeight,
          size: selectedVideo ? (selectedVideo.size / (1024 * 1024)).toFixed(2) : 0, // MB
          name: selectedVideo ? selectedVideo.name : '',
          type: selectedVideo ? selectedVideo.type : ''
        });
      };
    }
  }, [videoPreview, selectedVideo]);

  // 处理视频文件选择
  const handleVideoChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {

      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setVideoId(null); // 清除之前的视频ID

      // setUploadingVideo(true);
      // setUploadProgress(0);
      // setError('');

      // 如果没有设置名称，则使用文件名
      const name = file.name;

      // 使用修改后的uploadVideo函数，传入名称和进度回调
      await uploadVideo(file, name);

      // await fetchVideos();
      // setVideoName('');
      // setShowVideoUploadForm(false);
      // setUploadProgress(0);
    } catch (error) {
      // setError('上传视频失败。请重试。');
      console.error('新增任务-上传视频错误:', error);
    } finally {
      // setUploadingVideo(false);
    }
  };

  // 处理背景图片选择
  const handleBackgroundChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setBGid(undefined)
      setSelectedBackground(file);
      setBackgroundPreview(URL.createObjectURL(file));
    }
  };

  // 处理开始任务按钮
  const handleStartTask = async () => {
    if (!selectedVideo && !videoId) {
      setError('请选择要处理的视频');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // let currentVideoId = videoId;

      // 如果是新上传的视频，则先上传
      // if (selectedVideo && !videoId) {
      //   const uploadedVideo = await uploadVideo(selectedVideo);
      //   currentVideoId = uploadedVideo.video.id;
      //   setVideoId(currentVideoId);
      // }

      // 如果有选择背景且需要应用背景，则上传背景
      // if (selectedBackground && applyBackground) {
      //   await uploadBackgroundImage(currentVideoId, selectedBackground);
      // }

      const params = {
        videoFile: selectedVideo || undefined,
        videoId,
        modelType: selectedModel,
        backgroundFile: selectedBackground,
        backgroundId: bgId,
        userId: currentUser.id
        // applyBackground: applyBackground &&!!selectedBackground
      }

      console.log('hxy--------------- currentUser, params', currentUser, params)


      // 开始视频分割处理
      // await startVideoSegmentation(currentVideoId, selectedModel);

      // 创建视频处理任务
      // await createTask(currentVideoId, {
      //   modelId: selectedModel,
      //   applyBackground: applyBackground && !!selectedBackground
      // });

      const res = await createTaskV2(params);
      console.log('hxy--------------- res', res)

      setTaskCreated(true);

      // 任务创建成功后延迟跳转到仪表盘
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      setError('任务创建失败：' + (error.response?.data?.message || error.message || '未知错误'));
      console.error('任务创建错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取背景库
  // 修改fetchBackgrounds函数
  const fetchBackgrounds = async () => {
  try {
    setBackgroundsLoading(true);
    const data = await getAllBackgrounds();
    setBackgrounds(data.list || []);
    // 如果需要分页，可以添加hasMoreBackgrounds状态
    return data;
  } catch (error) {
    console.error('获取背景库失败:', error);
  } finally {
    setBackgroundsLoading(false);
  }
};

// 修改fetchVideos函数
const fetchVideos = async () => {
  try {
    setVideosLoading(true);
    const data = await getAllVideos();
    setVideos(data.list || []);
    // 如果需要分页，可以添加hasMoreVideos状态
    return data;
  } catch (error) {
    console.error('获取视频库失败:', error);
  } finally {
    setVideosLoading(false);
  }
};

  // 从背景库选择背景
  const handleSelectFromLibrary = (background) => {
    console.log('hxy--------------- background', background)

    setBGid(background.id);
    setSelectedBackground(null);
    // 修改背景图片路径
    const imagePath = `${API_BASE_URL}/${background.path}`;

    // 创建新的Image对象，加载图片
    const img = new Image();
    img.onload = () => {
      // 创建临时文件对象
      fetch(imagePath)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], background.name || 'background.jpg', { type: blob.type });
          // setSelectedBackground(file);
          setBackgroundPreview(imagePath);
        })
        .catch(error => {
          console.error('获取背景图片失败:', error);
        });
    };
    img.onerror = () => {
      console.error('背景图片加载失败');
    };
    img.src = imagePath;

    setShowBackgroundDialog(false);
  };

  // 从视频库选择视频
  const handleSelectVideoFromLibrary = (video) => {
    setSelectedVideo(null);
    setVideoId(video.id);

    const videoPath = `${API_BASE_URL}/${video.originalVideo}`;
    setVideoPreview(videoPath);

    // 模拟设置视频信息
    setVideoInfo({
      name: video.originalVideo.split('/').pop() || 'video.mp4',
      size: '未知',
      type: '未知',
      duration: '未知',
      width: '未知',
      height: '未知'
    });

    setShowVideoDialog(false);
  };

  return (
    <Container maxWidth='md'>
      <Paper elevation={3} sx={{ p: 3, mt: 4, borderRadius: 2 }}>
        <Typography variant='h4' align='center' gutterBottom>
          创建视频分割任务
        </Typography>

        {/* 添加 ref 到错误提示元素 */}
        {error && !loading && (
          <Alert ref={errorRef} severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {taskCreated ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant='h6' gutterBottom>
              任务已成功创建！
            </Typography>
            <Typography variant='body1' color='textSecondary'>
              您的视频处理任务已加入队列，稍后将自动跳转到仪表盘查看进度。
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* 视频选择区域 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant='h6' gutterBottom>
                1. 选择视频
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant='contained'
                  startIcon={<CloudUpload />}
                  onClick={() => videoInputRef.current.click()}
                >
                  上传新视频
                </Button>

                <Button
                  variant='outlined'
                  onClick={() => setShowVideoDialog(true)}
                >
                  从视频库选择
                </Button>
              </Box>

              <input
                type='file'
                accept='video/*'
                style={{ display: 'none' }}
                ref={videoInputRef}
                onChange={handleVideoChange}
              />

              {videoPreview && (
                <Box sx={{ mt: 2 }}>
                  <Card sx={{ maxWidth: 600, mx: 'auto' }}>
                    <CardMedia
                      component='video'
                      controls
                      src={videoPreview}
                      sx={{ maxHeight: 300 }}
                      ref={videoRef}
                    />
                  </Card>
                  {videoInfo && (
                    <Typography
                      variant='body2'
                      color='textSecondary'
                      sx={{ mt: 1, textAlign: 'center' }}
                    >
                      {videoInfo.name}
                      {videoInfo.size !== '未知' && ` (${videoInfo.size} MB)`}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 背景选择区域 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant='h6' gutterBottom>
                2. 设置背景
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={applyBackground}
                    onChange={(e) => setApplyBackground(e.target.checked)}
                  />
                }
                label='应用自定义背景'
                sx={{ mb: 2 }}
              />

              {applyBackground && (
                <>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      variant='contained'
                      startIcon={<Wallpaper />}
                      onClick={() => backgroundInputRef.current.click()}
                    >
                      上传新背景
                    </Button>

                    <Button
                      variant='outlined'
                      onClick={() => setShowBackgroundDialog(true)}
                    >
                      从背景库选择
                    </Button>
                  </Box>

                  <input
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    ref={backgroundInputRef}
                    onChange={handleBackgroundChange}
                  />

                  {backgroundPreview ? (
                    <Box sx={{ mt: 2 }}>
                      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
                        <CardMedia
                          component='img'
                          image={backgroundPreview}
                          sx={{ height: 300, objectFit: 'contain' }}
                        />
                      </Card>
                      {selectedBackground && (
                        <Typography
                          variant='body2'
                          color='textSecondary'
                          sx={{ mt: 1, textAlign: 'center' }}
                        >
                          {selectedBackground.name}
                          {selectedBackground.size &&
                            ` (${(
                              selectedBackground.size /
                              (1024 * 1024)
                            ).toFixed(2)} MB)`}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Alert severity='info' sx={{ mb: 3 }}>
                      您还没有选择背景图片。
                    </Alert>
                  )}
                </>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 模型选择区域 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant='h6' gutterBottom>
                3. 选择分割模型
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id='model-select-label'>选择分割模型</InputLabel>
                <Select
                  labelId='model-select-label'
                  value={selectedModel}
                  label='选择分割模型'
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {segmentationModels.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 显示所选模型的说明 */}
              <Paper variant='outlined' sx={{ p: 2 }}>
                <Typography variant='body2' color='textSecondary'>
                  {
                    segmentationModels.find((m) => m.id === selectedModel)
                      ?.description
                  }
                </Typography>
              </Paper>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 任务确认和开始按钮 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant='contained'
                color='primary'
                size='large'
                onClick={handleStartTask}
                disabled={
                  (!selectedVideo && !videoId) ||
                  loading ||
                  (!selectedBackground && !bgId)
                }
                sx={{ minWidth: 200 }}
              >
                {loading ? <CircularProgress size={24} /> : '开始任务'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* 背景库选择对话框 */}
      <Dialog
        open={showBackgroundDialog}
        onClose={() => setShowBackgroundDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>选择背景</DialogTitle>
        <DialogContent>
          {backgroundsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : backgrounds.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant='body1' color='textSecondary'>
                背景库中没有可用的背景图片。
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {backgrounds.map((background) => (
                <Grid item xs={6} sm={4} md={3} key={background.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 6 }
                    }}
                    onClick={() => handleSelectFromLibrary(background)}
                  >
                    <CardMedia
                      component='img'
                      height='120'
                      image={`${API_BASE_URL}/${background.path}`}
                      alt={background.name || '背景图片'}
                    />
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant='body2' noWrap>
                        {background.name}
                        {background.name || `背景 ${background.id}`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* 视频库选择对话框 */}
      <Dialog
        open={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>选择视频</DialogTitle>
        <DialogContent>
          {videosLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : videos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant='body1' color='textSecondary'>
                视频库中没有可用的视频。
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {videos.map((video) => (
                <Grid item xs={12} sm={6} md={4} key={video.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 6 }
                    }}
                    onClick={() => handleSelectVideoFromLibrary(video)}
                  >
                    <CardMedia
                      component='video'
                      height='140'
                      image={`${API_BASE_URL}/${video.originalVideo}`}
                    />
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant='body2' noWrap>
                        {video.originalVideo.split('/').pop() ||
                          `视频 ${video.id}`}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        添加时间:{' '}
                        {new Date(video.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  )
};

export default VideoUpload;
