import React, { useState, useEffect, useRef, useContext } from 'react';
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
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  TextField,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Delete,
  MovieFilter,
  Visibility,
  Add,
  Refresh,
  Edit,
  CloudUpload,
  Wallpaper
} from '@mui/icons-material';
import {
  getAllVideos,
  deleteVideo,
  getAllTasks,
  getAllTasksV2,
  changeVideoBackground,
  getAllBackgrounds,
  uploadBackgroundToLibrary,
  deleteBackground,
  uploadVideo
} from '../../services/videoService';
import { AuthContext } from '../../contexts/AuthContext';

import { API_BASE_URL} from '../../config'
import dayjs from 'dayjs'
import {DATE_SECOND_FORMAT} from '../../constants/index.ts'
import { MODEL_TYPE_MAP } from '../../constants/maps.ts'

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
  const [tasks, setTasks] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [backgroundToDelete, setBackgroundToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0: 视频列表, 1: 任务列表, 2: 背景库
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [backgroundName, setBackgroundName] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [deleteBackgroundDialogOpen, setDeleteBackgroundDialogOpen] = useState(false);
  // 视频上传相关状态
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoName, setVideoName] = useState('');
  const [showVideoUploadForm, setShowVideoUploadForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const backgroundInputRef = useRef(null);
  const videoInputRef = useRef(null);


  // 页面加载时获取数据
  useEffect(() => {
    fetchData();

    // 每30秒自动刷新一次数据
    const intervalId = setInterval(fetchData, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // 同时获取视频、任务和背景数据
  const fetchData = async () => {
    try {
      setError('');
      await Promise.all([fetchVideos(), fetchTasks(), fetchBackgrounds()]);
    } catch (error) {
      setError('数据加载失败。请重试。');
      console.error('数据加载错误:', error);
    }
  };

  // 获取视频列表
  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('hxy--------------- 111', 111)

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

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      const data = await getAllTasksV2({
        "userId": currentUser.id,
        "pageNum": 1,
        "pageSize": 20, // todo
      });
      console.log('hxy--------------- data', data)

      // 确保tasks是一个数组
      setTasks(data?.list?.length ? data?.list : []);
      return data;
    } catch (error) {
      console.error('获取任务列表失败:', error);
      return [];
    }
  };

  // 获取背景列表
  const fetchBackgrounds = async () => {
    try {
      const data = await getAllBackgrounds();
      // 确保backgrounds是一个数组
      setBackgrounds(Array.isArray(data) ? data : (data?.backgrounds || []));
      return data;
    } catch (error) {
      console.error('获取背景列表失败:', error);
      return [];
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

  // 打开删除背景确认对话框
  const handleDeleteBackgroundClick = (background) => {
    setBackgroundToDelete(background);
    setDeleteBackgroundDialogOpen(true);
  };

  // 关闭删除背景确认对话框
  const handleDeleteBackgroundClose = () => {
    setDeleteBackgroundDialogOpen(false);
    setBackgroundToDelete(null);
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

  // 删除背景
  const handleDeleteBackgroundConfirm = async () => {
    if (!backgroundToDelete) return;

    try {
      await deleteBackground(backgroundToDelete.id);
      setBackgrounds(backgrounds.filter(bg => bg.id !== backgroundToDelete.id));
      handleDeleteBackgroundClose();
    } catch (error) {
      setError('删除背景失败。请重试。');
      console.error('删除背景错误:', error);
    }
  };

  // 修改视频背景
  const handleChangeBackground = async (videoId, backgroundId) => {
    try {
      await changeVideoBackground(videoId, backgroundId);
      fetchData(); // 重新加载数据
    } catch (error) {
      setError('修改背景失败。请重试。');
      console.error('修改背景错误:', error);
    }
  };

  // 上传背景图片到库
  const handleBackgroundUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingBackground(true);
      setError('');
      await uploadBackgroundToLibrary(file, backgroundName);
      await fetchBackgrounds();
      setBackgroundName('');
      setShowUploadForm(false);
    } catch (error) {
      setError('上传背景失败。请重试。');
      console.error('上传背景错误:', error);
    } finally {
      setUploadingBackground(false);
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

  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 获取背景图片URL
  // 修改缩略图和背景路径
  const getBackgroundImageUrl = (background) => {
    return `${API_BASE_URL}/${background.path}`;
  };


  // 视频缩略图或占位符
  const getVideoThumbnail = (video) => {
    if (video.finalVideo) {
      return `${API_BASE_URL}/${video.finalVideo}`;
    } else if (video.extractedForeground) {
      return `${API_BASE_URL}/${video.extractedForeground}`;
    } else if (video.originalVideo) {
      return `${API_BASE_URL}/${video.originalVideo}`;
    }
    return 'https://via.placeholder.com/320x180?text=无预览';
  };

  // 格式化日期
  const formatDate = (dateString) => {
    return dayjs(dateString).format(DATE_SECOND_FORMAT)
  };

  // 视频状态显示
  const getStatusDisplay = (status) => {
    return (
      <Chip
        label={statusTranslations[status] || status}
        color={statusColors[status] || 'default'}
        size="small"
        sx={{ textTransform: 'capitalize' }}
      />
    );
  };

  // 任务进度显示
  const getTaskProgress = (task) => {
    let progress = 0;
    let statusText = '';

    switch (task.status) {
      case 'waiting':
        progress = 0;
        statusText = '等待处理';
        break;
      case 'processing':
        progress = task.progress || 50;
        statusText = `处理中 (${progress}%)`;
        break;
      case 'completed':
        progress = 100;
        statusText = '已完成';
        break;
      case 'failed':
        progress = 0;
        statusText = '处理失败';
        break;
      default:
        statusText = task.status;
    }

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">{statusText}</Typography>
          <Typography variant="body2">{progress}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          color={task.status === 'failed' ? 'error' : 'primary'}
        />
      </Box>
    );
  };

  if (loading && videos.length === 0 && tasks.length === 0 && backgrounds.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderVideoList = () => {
    return (
      <>
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
                        {video.name ||
                          (video.originalVideo
                            ? video.originalVideo.split('/').pop()
                            : `视频 ${video.id}`)}
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
                            statusTranslations[video.status] || video.status
                          }
                          color={statusColors[video.status] || 'default'}
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
                      to={`/upload?videoId=${video.id}`}
                    >
                      分割
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </>
    )
  };

  const renderTaskList = () => {
    if (tasks.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            暂无任务
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            创建一个视频任务以开始处理！
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/upload"
            startIcon={<Add />}
          >
            创建任务
          </Button>
        </Box>
      );
    }

    return (
      <>
        <div style={{marginBottom: 20}}>

        <Button
          variant='contained'
          color='primary'
          component={Link}
          to='/upload'
          startIcon={<Add />}
        >
          创建任务
        </Button>
        </div>
        <Grid container spacing={3}>
          {tasks?.map((task) => (
            <Grid item xs={12} sm={6} key={task.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2
                    }}
                  >
                    <Typography variant='subtitle1' component='div'>
                      {task.videoName ||
                        `任务 ${String(task.id).substring(0, 8)}`}
                    </Typography>
                    {getStatusDisplay(task.status)}
                  </Box>

                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    创建于 {formatDate(task.startTime)}
                  </Typography>

                  <Box sx={{ my: 2 }}>{getTaskProgress(task)}</Box>

                  <Typography variant='body2' color='text.secondary'>
                    模型: {MODEL_TYPE_MAP[task.modelType] || '标准'}
                  </Typography>

                  {task.backgroundImage && (
                    <Typography variant='body2' color='text.secondary'>
                      自定义背景: 已设置
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ mt: 'auto' }}>
                  {task.status === 'completed' && (
                    <Button
                      size='small'
                      color='primary'
                      component={Link}
                      to={`/videos/${task.videoId}`}
                      startIcon={<Visibility />}
                    >
                      查看结果
                    </Button>
                  )}
                  {(task.status === 'waiting' || task.status === 'failed') && (
                    <Button
                      size='small'
                      color='secondary'
                      component={Link}
                      to={`/upload?taskId=${task.id}`}
                      startIcon={<Edit />}
                    >
                      修改任务
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </>
    )
  };

  const renderBackgroundList = () => {
    return (
      <>
        <Box sx={{ mb: 4 }}>
          {showUploadForm ? (
            <Box sx={{ mb: 3, p: 3, border: '1px dashed #ccc', borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                上传新背景
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="背景名称（可选）"
                  value={backgroundName}
                  onChange={(e) => setBackgroundName(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />

                <input
                  accept="image/*"
                  type="file"
                  style={{ display: 'none' }}
                  ref={backgroundInputRef}
                  onChange={handleBackgroundUpload}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={() => backgroundInputRef.current.click()}
                    disabled={uploadingBackground}
                  >
                    {uploadingBackground ? <CircularProgress size={24} /> : '选择图片'}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => setShowUploadForm(false)}
                  >
                    取消
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => setShowUploadForm(true)}
            >
              添加新背景
            </Button>
          )}
        </Box>

        {backgrounds.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Wallpaper sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              暂无背景图片
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              上传您的第一个背景图片！
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {backgrounds.map((background) => (
              <Grid item xs={12} sm={6} md={3} key={background.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={getBackgroundImageUrl(background)}
                    alt={background.name || '背景图片'}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography variant="subtitle1" component="div" noWrap>
                      {background.name}
                      {background.name || `背景 ${String(background.id).substring(0, 8)}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      上传于 {formatDate(background.createdAt || new Date())}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ mt: 'auto' }}>
                    <Tooltip title="使用此背景">
                      <IconButton
                        color="primary"
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteBackgroundClick(background)}
                      startIcon={<Delete />}
                    >
                      删除
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderVideoList();
      case 1:
        return renderTaskList();
      case 2:
        return renderBackgroundList();
      default:
        return renderVideoList();
    }
  };

  return (
    <Container maxWidth='lg'>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}
        >
          <Typography variant='h4' component='h1'>
            {activeTab === 0
              ? '我的视频'
              : activeTab === 1
              ? '任务列表'
              : '背景库'}
          </Typography>
          <Box>
            <Button
              variant='outlined'
              onClick={fetchData}
              startIcon={<Refresh />}
              sx={{ mr: 2 }}
            >
              刷新
            </Button>
            <Button
              variant='contained'
              color='primary'
              component={Link}
              to='/upload'
              startIcon={<Add />}
            >
              创建任务
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            sx={{ mb: 2 }}
          >
            <Tab label='视频库' />
            <Tab label='任务列表' />
            <Tab label='背景库' />
          </Tabs>
          <Divider />
        </Box>

        {renderTabContent()}
      </Box>

      {/* 删除视频确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>删除视频</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除此视频吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>取消</Button>
          <Button onClick={handleDeleteConfirm} color='error' autoFocus>
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除背景确认对话框 */}
      <Dialog
        open={deleteBackgroundDialogOpen}
        onClose={handleDeleteBackgroundClose}
      >
        <DialogTitle>删除背景</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除此背景图片吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteBackgroundClose}>取消</Button>
          <Button
            onClick={handleDeleteBackgroundConfirm}
            color='error'
            autoFocus
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
};

export default VideoList;
