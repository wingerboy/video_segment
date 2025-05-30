import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CardContent
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Wallpaper as WallpaperIcon,
  VideoCameraBack as VideoIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Refresh as RefreshIcon,
  CloseCircle as CancelIcon
} from '@mui/icons-material';
import { uploadVideo, getAllVideos, getFullUrl } from '../../services/videoService';
import { createTask, getAvailableModels, getFrozenBalance } from '../../services/taskService';
import { getUserBackgrounds, uploadBackground, getFullUrl as getBackgroundFullUrl } from '../../services/backgroundService';
import { useAuth, UserEvents } from '../../contexts/AuthContext';

// CreateTask组件
const CreateTask = () => {
  // 导航和路由
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, getCurrentUser } = useAuth();
  
  // 步骤控制
  const [activeStep, setActiveStep] = useState(0);
  
  // 文件引用
  const videoInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const videoRef = useRef(null);
  
  // 视频状态
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  
  // 背景状态
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState('');
  const [backgrounds, setBackgrounds] = useState([]);
  const [backgroundsLoading, setBackgroundsLoading] = useState(false);
  const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);
  const [backgroundFromLibrary, setBackgroundFromLibrary] = useState(null);
  
  // 模型选择
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  
  // 任务状态
  const [taskCreated, setTaskCreated] = useState(false);
  const [taskId, setTaskId] = useState(null);
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 确认对话框
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dimensionsMatch, setDimensionsMatch] = useState(true);
  
  // 费用计算相关
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [frozenBalance, setFrozenBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [balanceSufficient, setBalanceSufficient] = useState(true);

  // 加载背景库、视频库和可用模型以及冻结余额
  useEffect(() => {
    fetchBackgrounds();
    fetchVideos();
    fetchModels();
    fetchFrozenBalance();
    
    // 组件挂载时注册余额更新监听器
    const unsubscribe = UserEvents.on(UserEvents.BALANCE_UPDATED, handleBalanceUpdated);
    
    // 组件卸载时取消监听
    return () => {
      unsubscribe();
    };
  }, []);

  // 余额更新事件处理函数
  const handleBalanceUpdated = (data) => {
    console.log('收到余额更新事件:', data);
    
    // 获取最新用户信息
    getCurrentUser().then(() => {
      // 重新计算费用和可用余额
      calculateEstimatedCost();
    }).catch(error => {
      console.error('更新用户信息失败:', error);
    });
  };

  // 获取用户任务冻结的金额
  const fetchFrozenBalance = async () => {
    try {
      const frozen = await getFrozenBalance();
      setFrozenBalance(frozen);
      
      // 计算可用余额
      const totalBalance = parseFloat(currentUser?.balance || 0);
      const available = Math.max(0, totalBalance - frozen);
      setAvailableBalance(available);
      
      console.log('余额信息:', {
        总余额: totalBalance,
        冻结金额: frozen,
        可用余额: available
      });
    } catch (error) {
      console.error('获取冻结余额失败:', error);
    }
  };

  // 获取可用模型列表
  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      const models = await getAvailableModels();
      // 过滤掉modelAlias为'default'的模型
      const filteredModels = models
        .filter(model => model.modelAlias !== 'default')
        .sort((a, b) => (b.modelUsageCnt || 0) - (a.modelUsageCnt || 0));
      
      // 如果过滤后没有模型，显示错误
      if (filteredModels.length === 0) {
        setError('没有可用的处理模型，请联系管理员');
        setAvailableModels([]);
        setSelectedModel('');
      } else {
        setAvailableModels(filteredModels);
        // 设置默认选择的模型，如果有
        // 尝试找到标记为推荐的模型
        const recommendedModel = filteredModels.find(m => 
          m.modelDescription?.toLowerCase().includes('推荐')
        );
        setSelectedModel(recommendedModel ? recommendedModel.modelAlias : filteredModels[0].modelAlias);
      }
    } catch (error) {
      console.error('加载模型列表失败:', error);
      setError('无法加载可用模型，请刷新页面重试');
    } finally {
      setModelsLoading(false);
    }
  };

  // 计算预估费用
  const calculateEstimatedCost = async () => {
    if (!selectedVideo || !selectedModel) {
      setEstimatedCost(0);
      return;
    }
    
    // 获取所选模型信息
    const model = availableModels.find(m => m.modelAlias === selectedModel);
    if (!model) {
      setEstimatedCost(0);
      return;
    }
    
    // 获取视频帧数和每帧价格
    const frameCnt = selectedVideo.oriVideoFrameCnt || 0;
    const pricePerFrame = parseFloat(model.pricePerFrame || 0.01);
    
    // 计算预估费用
    const cost = frameCnt * pricePerFrame;
    setEstimatedCost(cost);
    
    // 刷新冻结余额
    await fetchFrozenBalance();
    
    // 检查余额是否足够
    const totalBalance = parseFloat(currentUser?.balance || 0);
    const available = Math.max(0, totalBalance - frozenBalance);
    setAvailableBalance(available);
    setBalanceSufficient(available >= cost);
    
    console.log('费用计算:', {
      视频帧数: frameCnt,
      单价: pricePerFrame,
      总费用: cost,
      总余额: totalBalance,
      冻结金额: frozenBalance,
      可用余额: available,
      余额充足: available >= cost
    });
  };

  // 当选择视频或模型变化时，重新计算费用
  useEffect(() => {
    if (selectedVideo && selectedModel) {
      calculateEstimatedCost();
    }
  }, [selectedVideo, selectedModel]);

  // 当前用户信息变化时，重新获取冻结余额
  useEffect(() => {
    if (currentUser) {
      fetchFrozenBalance();
    }
  }, [currentUser]);

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

  // 处理URL参数
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const videoIdParam = searchParams.get('videoId');
    const backgroundIdParam = searchParams.get('backgroundId');
    const taskIdParam = searchParams.get('taskId');
    
    if (videoIdParam) {
      // 如果URL中有videoId参数，从视频库加载该视频
      loadVideoById(videoIdParam);
    }
    
    if (backgroundIdParam) {
      // 如果URL中有backgroundId参数，从背景库加载该背景
      loadBackgroundById(backgroundIdParam);
    }
    
    if (taskIdParam && !videoIdParam && !backgroundIdParam) {
      // 如果URL中有taskId参数，可以基于任务加载视频和背景
      console.log('未实现：基于任务ID加载视频和背景', taskIdParam);
      // TODO: 实现基于任务ID加载视频和背景的逻辑
    }
  }, [location]);
  
  // 根据视频ID加载视频
  const loadVideoById = async (videoId) => {
    try {
      const videos = await getAllVideos();
      const videoList = Array.isArray(videos) ? videos : (videos?.videos || []);
      const video = videoList.find(v => v.id === parseInt(videoId) || v.id === videoId);
      
      if (video) {
        handleSelectVideoFromLibrary(video);
      }
    } catch (error) {
      console.error('加载视频失败:', error);
      setError('无法加载指定视频，请手动选择');
    }
  };

  // 根据背景ID加载背景
  const loadBackgroundById = async (backgroundId) => {
    try {
      const backgrounds = await getUserBackgrounds();
      const backgroundList = Array.isArray(backgrounds) ? backgrounds : (backgrounds?.backgrounds || []);
      const background = backgroundList.find(b => b.id === parseInt(backgroundId) || b.id === backgroundId);
      
      if (background) {
        handleSelectFromLibrary(background);
      }
    } catch (error) {
      console.error('加载背景失败:', error);
      setError('无法加载指定背景，请手动选择');
    }
  };

  // 处理视频文件选择
  const handleVideoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setVideoId(null); // 清除之前的视频ID
    }
  };

  // 处理背景图片选择
  const handleBackgroundChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedBackground(file);
      setBackgroundPreview(URL.createObjectURL(file));
    }
  };

  // 处理开始任务按钮
  const handleStartTask = async () => {
    if (!videoId) {
      setError('请选择要处理的视频');
      return;
    }

    if (!backgroundFromLibrary) {
      setError('请选择背景图片');
      return;
    }
    
    // 重新计算费用并检查余额
    await calculateEstimatedCost();
    
    // 不论余额是否充足，都检查尺寸并打开确认对话框
    // 余额不足的情况会在确认对话框中显示
    checkDimensions();
    
    // 打开确认对话框
    setShowConfirmDialog(true);
  };

  // 检查视频和背景尺寸是否匹配
  const checkDimensions = () => {
    if (!videoInfo || !backgroundFromLibrary) {
      return;
    }

    // 获取视频尺寸
    const videoDim = `${videoInfo.width}x${videoInfo.height}`;
    
    // 获取背景尺寸
    const backgroundDim = backgroundFromLibrary.backgroundDim;

    // 检查尺寸是否匹配
    const match = videoDim === backgroundDim;
    setDimensionsMatch(match);
    
    console.log('尺寸比较:', { 
      视频尺寸: videoDim, 
      背景尺寸: backgroundDim, 
      匹配: match 
    });
  };

  // 确认并创建任务
  const confirmAndCreateTask = async () => {
    // 最后一次检查余额是否充足
    await calculateEstimatedCost();
    
    // 余额不足时不尝试创建任务，但保持对话框打开展示余额不足信息
    if (!balanceSufficient) {
      return; // 保持对话框打开，让用户能看到余额不足警告
    }
    
    setShowConfirmDialog(false);
    setLoading(true);
    setError('');

    try {
      // 确保有选择模型
      if (!selectedModel) {
        throw new Error('请选择处理模型');
      }
      
      // 准备提交的数据
      let taskData = {
        videoId: videoId, // 必须有
        modelAlias: selectedModel, // 模型别名
        taskCost: parseFloat(estimatedCost.toFixed(2)) // 预估费用
      };

      // 如果有背景，添加背景ID
      if (backgroundFromLibrary) {
        taskData.backgroundId = backgroundFromLibrary.id;
      }

      console.log('创建任务数据:', taskData);
      const response = await createTask(videoId, taskData);
      console.log('任务创建响应:', response);

      if (response && response.task) {
        setTaskCreated(true);
        setTaskId(response.task.id);
        
        // 成功后跳转到仪表盘页面而不是任务详情
        setTimeout(() => {
          navigate('/dashboard#tasks');
        }, 1500);
      } else {
        setError('创建任务失败，请重试');
      }
    } catch (error) {
      setError(error.message || '创建任务失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取背景库
  const fetchBackgrounds = async () => {
    try {
      setBackgroundsLoading(true);
      const data = await getUserBackgrounds();
      setBackgrounds(Array.isArray(data) ? data : (data?.backgrounds || []));
    } catch (error) {
      console.error('获取背景库失败:', error);
    } finally {
      setBackgroundsLoading(false);
    }
  };

  // 获取视频库
  const fetchVideos = async () => {
    try {
      setVideosLoading(true);
      const data = await getAllVideos();
      const allVideos = Array.isArray(data) ? data : (data?.videos || []);
      // 过滤掉已删除的视频(状态不是exists的视频)
      const availableVideos = allVideos.filter(video => video.oriVideoStatus === 'exists');
      setVideos(availableVideos);
    } catch (error) {
      console.error('获取视频库失败:', error);
    } finally {
      setVideosLoading(false);
    }
  };

  // 从背景库选择背景
  const handleSelectFromLibrary = async (background) => {
    if (!background) return;
    
    setBackgroundFromLibrary(background);
    
    // 获取背景路径并转换为完整URL
    const path = background.backgroundPath || background.path;
    if (!path) {
      console.error('背景图片路径不存在', background);
      setError('背景图片路径不存在');
      return;
    }
    
    // 使用getFullUrl处理路径
    const imagePath = getBackgroundFullUrl(path);
    console.log('选择背景:', background, '原始路径:', path, '处理后URL:', imagePath);
    
    setBackgroundPreview(imagePath);
    setShowBackgroundDialog(false);
  };

  // 从视频库选择视频
  const handleSelectVideoFromLibrary = (video) => {
    if (!video) return;
    
    console.log('选择视频:', video);
    setSelectedVideo(video);
    setVideoId(video.id);
    
    // 构建视频URL，使用getFullUrl函数
    const path = video.oriVideoPath || video.originalVideo || video.path;
    if (!path) {
      console.error('视频路径不存在', video);
      setError('视频路径不存在');
      return;
    }
    
    // 使用getFullUrl处理路径
    const videoUrl = getFullUrl(path);
    console.log('视频路径:', path, '处理后URL:', videoUrl);
    
    setVideoPreview(videoUrl);
    
    // 设置视频信息
    setVideoInfo({
      name: video.oriVideoName || video.name || (path ? path.split('/').pop() : 'video.mp4'),
      size: video.oriVideoSize || video.size || '未知',
      type: video.oriVideoType || video.type || '未知',
      duration: video.oriVideoDuration || video.duration || '未知',
      width: video.oriVideoDim ? video.oriVideoDim.split('x')[0] : (video.width || '未知'),
      height: video.oriVideoDim ? video.oriVideoDim.split('x')[1] : (video.height || '未知'),
      frameRate: video.oriVideoFrameRate || video.frameRate || '未知',
      codec: video.oriVideoCodec || video.codec || '未知'
    });
    
    // 计算费用
    calculateEstimatedCost();
    
    setShowVideoDialog(false);
  };

  // 渲染模型选择部分
  const renderModelSelection = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>选择处理模型</Typography>
      <Divider sx={{ mb: 2 }} />
      
      {modelsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <>
          {availableModels.length > 0 ? (
            <FormControl fullWidth margin="normal" required>
              <InputLabel>选择模型</InputLabel>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                label="选择模型"
                error={!selectedModel}
              >
                {availableModels.map((model) => (
                  <MenuItem key={model.modelAlias} value={model.modelAlias}>
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <Typography sx={{ flexGrow: 1 }}>{model.modelAlias}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {`${model.modelUsageCnt || 0}次使用`}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {selectedModel && (
                <Box sx={{ mt: 2 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1">
                      {selectedModel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {availableModels.find(m => m.modelAlias === selectedModel)?.modelDescription || '无描述'}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </FormControl>
          ) : (
            <Alert severity="error">
              没有可用的处理模型，请联系管理员添加模型配置
            </Alert>
          )}
        </>
      )}
    </Box>
  );

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          创建视频分割任务
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {taskCreated ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              任务已成功创建！
            </Typography>
            <Typography variant="body1" color="textSecondary">
              您的视频处理任务已加入队列，稍后将自动跳转到仪表盘查看任务列表。
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* 视频选择区域 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                1. 选择视频
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => setShowVideoDialog(true)}
                >
                  从视频库选择
                </Button>
              </Box>
              
              {videoPreview && (
                <Box sx={{ mt: 2 }}>
                  <Card sx={{ maxWidth: 600, mx: 'auto' }}>
                    <CardMedia
                      component="video"
                      controls
                      src={videoPreview}
                      sx={{ maxHeight: 300 }}
                      ref={videoRef}
                    />
                  </Card>
                  {videoInfo && (
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <Typography variant="body1" fontWeight="medium">
                        {videoInfo.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {videoInfo.width !== '未知' && videoInfo.height !== '未知' && `分辨率: ${videoInfo.width}x${videoInfo.height} • `}
                        {videoInfo.duration !== '未知' && `时长: ${videoInfo.duration}秒 • `}
                        {videoInfo.size !== '未知' && `大小: ${videoInfo.size} MB`}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* 背景选择区域 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                2. 设置背景
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => setShowBackgroundDialog(true)}
                >
                  从背景库选择
                </Button>
              </Box>
              
              {backgroundPreview ? (
                <Box sx={{ mt: 2 }}>
                  <Card sx={{ maxWidth: 600, mx: 'auto' }}>
                    <CardMedia
                      component="img"
                      image={backgroundPreview}
                      sx={{ height: 300, objectFit: 'contain' }}
                    />
                  </Card>
                  {backgroundFromLibrary && (
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <Typography variant="body1" fontWeight="medium">
                        {backgroundFromLibrary.backgroundName || backgroundFromLibrary.name || `背景 ${backgroundFromLibrary.id}`}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {backgroundFromLibrary.backgroundDim && `分辨率: ${backgroundFromLibrary.backgroundDim}`}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                  您还没有选择背景图片。
                </Alert>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* 模型选择区域 */}
            {renderModelSelection()}
            
            <Divider sx={{ my: 3 }} />
            
            {/* 任务确认和开始按钮 */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleStartTask}
                disabled={loading || !videoId || !backgroundFromLibrary}
                startIcon={loading ? <CircularProgress size={24} color="inherit" /> : null}
              >
                {loading ? '正在创建任务...' : '开始任务'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* 背景库选择对话框 */}
      <Dialog 
        open={showBackgroundDialog} 
        onClose={() => setShowBackgroundDialog(false)}
        maxWidth="md"
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
              <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                背景库中没有可用的背景图片。
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/dashboard#backgrounds')}
              >
                去上传背景
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {backgrounds.map(background => {
                const path = background.backgroundPath || background.path;
                const imagePath = getBackgroundFullUrl(path);
                return (
                  <Grid item xs={6} sm={4} md={3} key={background.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                        transition: 'all 0.2s'
                      }}
                      onClick={() => handleSelectFromLibrary(background)}
                    >
                      <CardMedia
                        component="img"
                        height="120"
                        image={imagePath}
                        alt={background.backgroundName || background.name || '背景图片'}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="body2" noWrap>
                          {background.backgroundName || background.name || `背景 ${background.id}`}
                        </Typography>
                        {background.backgroundDim && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            分辨率: {background.backgroundDim}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 视频库选择对话框 */}
      <Dialog 
        open={showVideoDialog} 
        onClose={() => setShowVideoDialog(false)}
        maxWidth="md"
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
              <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                视频库中没有可用的视频。
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/dashboard#videos')}
              >
                去上传视频
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {videos.map(video => {
                const path = video.oriVideoPath || video.originalVideo || video.path;
                const videoUrl = getFullUrl(path);
                return (
                  <Grid item xs={12} sm={6} md={4} key={video.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                        transition: 'all 0.2s'
                      }}
                      onClick={() => handleSelectVideoFromLibrary(video)}
                    >
                      <CardMedia
                        component="video"
                        height="140"
                        src={videoUrl}
                        controls
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent>
                        <Typography variant="body1" fontWeight="medium" noWrap>
                          {video.oriVideoName || video.name || (path ? path.split('/').pop() : `视频 ${video.id}`)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {video.oriVideoDim && `分辨率: ${video.oriVideoDim}`}
                          {video.oriVideoDuration && ` • 时长: ${video.oriVideoDuration}秒`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          添加时间: {new Date(video.createdAt).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* 任务确认对话框 */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>确认创建任务</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>任务信息确认</Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>视频信息</Typography>
              {videoInfo && (
                <Box>
                  <Typography variant="body2">名称: {videoInfo.name}</Typography>
                  <Typography variant="body2">
                    分辨率: <span style={{ fontWeight: !dimensionsMatch ? 'bold' : 'normal', color: !dimensionsMatch ? 'red' : 'inherit' }}>
                      {videoInfo.width}x{videoInfo.height}
                    </span>
                  </Typography>
                  <Typography variant="body2">时长: {videoInfo.duration}秒</Typography>
                  <Typography variant="body2">大小: {videoInfo.size} MB</Typography>
                  <Typography variant="body2">总帧数: {selectedVideo?.oriVideoFrameCnt || '未知'}</Typography>
                </Box>
              )}
            </Paper>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>背景信息</Typography>
              {backgroundFromLibrary && (
                <Box>
                  <Typography variant="body2">
                    名称: {backgroundFromLibrary.backgroundName || backgroundFromLibrary.name || `背景 ${backgroundFromLibrary.id}`}
                  </Typography>
                  <Typography variant="body2">
                    分辨率: <span style={{ fontWeight: !dimensionsMatch ? 'bold' : 'normal', color: !dimensionsMatch ? 'red' : 'inherit' }}>
                      {backgroundFromLibrary.backgroundDim}
                    </span>
                  </Typography>
                </Box>
              )}
            </Paper>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>模型信息</Typography>
              {selectedModel && (
                <Box>
                  <Typography variant="body2">
                    模型: {selectedModel}
                  </Typography>
                  <Typography variant="body2">
                    单价: {availableModels.find(m => m.modelAlias === selectedModel)?.pricePerFrame || '0.01'} 元/帧
                  </Typography>
                </Box>
              )}
            </Paper>
            
            {!dimensionsMatch && (
              <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  警告：视频与背景图片分辨率不匹配！
                </Typography>
                <Typography variant="body2">
                  这可能导致处理结果不理想。建议使用相同分辨率的背景图片以获得最佳效果。
                </Typography>
                <Typography variant="body2">
                  如果您确定要继续，请点击下方"确认创建"按钮。
                </Typography>
              </Alert>
            )}
            
            {/* 费用预估 */}
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mb: 2, 
                border: !balanceSufficient ? '1px solid #f44336' : undefined,
                bgcolor: !balanceSufficient ? 'rgba(244, 67, 54, 0.05)' : undefined 
              }}
            >
              <Typography variant="subtitle1" gutterBottom>费用预估</Typography>
              <Box>
                <Typography variant="body2">
                  视频总帧数: {selectedVideo?.oriVideoFrameCnt || '0'} 帧
                </Typography>
                <Typography variant="body2">
                  每帧价格: {availableModels.find(m => m.modelAlias === selectedModel)?.pricePerFrame || '0.01'} 元
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body1" fontWeight="bold" color={balanceSufficient ? 'success.main' : 'error.main'}>
                  预计费用: {estimatedCost.toFixed(2)} 元
                </Typography>
                <Typography variant="body2">
                  账户总余额: {parseFloat(currentUser?.balance || 0).toFixed(2)} 元
                </Typography>
                <Typography variant="body2">
                  已冻结金额: {frozenBalance.toFixed(2)} 元
                </Typography>
                <Typography variant="body2" fontWeight="medium" color={balanceSufficient ? 'success.main' : 'error.main'}>
                  可用余额: {availableBalance.toFixed(2)} 元
                </Typography>
                {!balanceSufficient && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mt: 1,
                      fontWeight: 'bold',
                      '& .MuiAlert-message': {
                        fontWeight: 'bold'
                      }
                    }}
                    variant="filled"
                  >
                    可用余额不足，请充值或等待其他任务完成后再试
                  </Alert>
                )}
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>取消</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={confirmAndCreateTask}
            disabled={loading || !balanceSufficient}
          >
            {loading ? '处理中...' : (balanceSufficient ? '确认创建' : '余额不足')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateTask; 