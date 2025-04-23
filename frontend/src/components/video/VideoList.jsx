import React, { useState,  useRef, useContext, useEffect } from 'react'

import {
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,

  LinearProgress,
  TextField,
  Paper
} from '@mui/material'
import {

  CloudUpload,

} from '@mui/icons-material'
import {
  getAllVideos,
  deleteVideo,
  uploadVideo
} from '../../services/videoService.js'
import { AuthContext } from '../../contexts/AuthContext.js'
import { API_BASE_URL } from '../../config.js'
import dayjs from 'dayjs'
import { DATE_SECOND_FORMAT } from '../../constants/index.ts'
import InfiniteScrollList from '../common/InfiniteScrollList.jsx'
import VideoCard from './VideoCard.jsx'

const statusColors = {
  waiting: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error'
}

const statusTranslations = {
  waiting: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败'
}

const pageSize = 10

const VideoList = React.forwardRef((props, ref) => {
  const { activeTab, setError } = props

  const { currentUser } = useContext(AuthContext)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoName, setVideoName] = useState('')
  const [showVideoUploadForm, setShowVideoUploadForm] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const videoInputRef = useRef(null)
  const videoContainerRef = useRef(null)

  const fetchVideos = async (page = 1, size = pageSize) => {
    try {
      return await getAllVideos({
        pageNum: page,
        pageSize: size,
        userId: currentUser.id
      })
    } catch (error) {
      console.error('获取视频列表失败:', error)
      return { list: [], total: 0, hasNextPage: false }
    }
  }

  const [refreshCount, setRefreshCount] = useState(0);

  const refreshData = async () => {
    try {
      const videoResult = await fetchVideos(1);
       setRefreshCount(prev => prev + 1);
      // 确保正确设置 videos 状态
      if (videoResult && videoResult.list) {
        // 数据更新后滚动到顶部
        if (videoContainerRef.current) {
          videoContainerRef.current.scrollTop = 0;
        }
      }
    } catch (error) {
      console.error('刷新视频库失败:', error);
      setError('刷新视频库失败。请重试。');
    }
  };

  // 将刷新方法挂载到组件实例上
  React.useImperativeHandle(ref, () => ({
    refreshData
  }))

  const handleDeleteClick = (video) => {
    setVideoToDelete(video)
    setDeleteDialogOpen(true)
  }

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false)
    setVideoToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return

    try {
      await deleteVideo(videoToDelete.id)
      // 移除多余的 fetchVideos 调用
      // fetchVideos()
      handleDeleteClose()
      // 触发 InfiniteScrollList 重新加载数据
      setRefreshCount(prev => prev + 1);
    } catch (error) {
      setError('删除视频失败。请重试。')
      console.error('删除视频错误:', error)
    }
  }

  useEffect(() => console.log('VideoList 组件渲染'),[])

  const [refreshInterval, setRefreshInterval] = useState(null);

  // 清除定时器
  const clearRefreshInterval = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };

  // 启动定时器
  const startRefreshInterval = () => {
    clearRefreshInterval();
    const intervalId = setInterval(() => {
      refreshData();
    }, 30000);
    setRefreshInterval(intervalId);
  };

  // 监听上传状态
  useEffect(() => {
    if (uploadingVideo) {
      startRefreshInterval();
    } else {
      clearRefreshInterval();
    }
    return () => clearRefreshInterval();
  }, [uploadingVideo]);

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingVideo(true);
      startRefreshInterval(); // 开始上传时启动定时器
      setUploadProgress(0);
      setError('');

      const name = videoName || file.name;
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
      clearRefreshInterval(); // 上传完成后清除定时器
    }
  };

  const getVideoThumbnail = (video) => {
    if (video.finalVideo) {
      return `${API_BASE_URL}/${video.finalVideo}`
    } else if (video.extractedForeground) {
      return `${API_BASE_URL}/${video.extractedForeground}`
    } else if (video.originalVideo) {
      return `${API_BASE_URL}/${video.originalVideo}`
    }
    return 'https://via.placeholder.com/320x180?text=无预览'
  }

  const formatDate = (dateString) => {
    return dayjs(dateString).format(DATE_SECOND_FORMAT)
  }

  const renderVideoList = () => {
    return (
      <>
        <div
          ref={videoContainerRef}
          style={{
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 250px)',
            marginBottom: '20px',
            paddingBottom: '30px' // 添加底部内边距
          }}
        >
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

              {/* {uploadingVideo && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    上传进度: {uploadProgress}%
                  </Typography>
                  <LinearProgress
                    variant='determinate'
                    value={uploadProgress}
                  />
                </Box>
              )} */}

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

          <Grid container spacing={3}>
            <InfiniteScrollList
              fetchData={fetchVideos}
              containerRef={videoContainerRef}
              reloadDeps={[activeTab, refreshCount]}
              // 不传递 initialData，让 InfiniteScrollList 自己发起首次请求
              // initialData={videos}
              renderItem={(video) => (
                <Grid item xs={12} sm={6} md={4} key={video.id}>
                  <VideoCard
                    video={video}
                    onDelete={handleDeleteClick}
                    getThumbnail={getVideoThumbnail}
                    formatDate={formatDate}
                    statusTranslations={statusTranslations}
                    statusColors={statusColors}
                  />
                </Grid>
              )}
            />
          </Grid>
        </div>

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
      </>
    )
  }

  return renderVideoList()
})

export default VideoList;
