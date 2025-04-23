import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  Delete,
  Add,
  CloudUpload,
} from '@mui/icons-material';
import {
  getAllBackgrounds,
  uploadBackgroundToLibrary,
  deleteBackground,
} from '../../services/videoService';
import { AuthContext } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config';
import dayjs from 'dayjs';
import { DATE_SECOND_FORMAT } from '../../constants/index.ts';
import InfiniteScrollList from '../common/InfiniteScrollList';

const pageSize = 10;

const BackgroundList = React.forwardRef((props, ref) => {
  const {activeTab, setError } = props
  const { currentUser } = useContext(AuthContext);
  const [backgrounds, setBackgrounds] = useState([]);
  // 添加 refreshCount 状态
  const [refreshCount, setRefreshCount] = useState(0);
  const [deleteBackgroundDialogOpen, setDeleteBackgroundDialogOpen] = useState(false);
  const [backgroundToDelete, setBackgroundToDelete] = useState(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [backgroundName, setBackgroundName] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  const backgroundInputRef = useRef(null);
  const backgroundContainerRef = useRef(null);

  useEffect(() => {
    let intervalId;
    // 仅在有任务上传时启动定时刷新
    if (uploadingBackground) {
      fetchData();
      intervalId = setInterval(fetchData, 30000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [uploadingBackground]); // 添加依赖项

  const fetchData = async () => {
    try {
      setError('');
      const backgroundResult = await fetchBackgrounds(1);
      setBackgrounds(backgroundResult.list);
      // 数据更新后滚动到顶部
      if (backgroundContainerRef.current) {
        backgroundContainerRef.current.scrollTop = 0;
      }
    } catch (error) {
      setError('数据加载失败。请重试。');
      console.error('数据加载错误:', error);
    }
  };

  const fetchBackgrounds = async (page = 1, size = pageSize) => {
    console.log('Fetching backgrounds...');
    try {
      return await getAllBackgrounds({ pageNum: page, pageSize: size, userId: currentUser.id });
    } catch (error) {
      console.error('获取背景列表失败:', error);
      return { list: [], total: 0, hasNextPage: false };
    }
  };

  const refreshData = async () => {
    try {
      const backgroundResult = await fetchBackgrounds(1);
      setBackgrounds(backgroundResult.list);
      setRefreshCount(prev => prev + 1);
      // 数据更新后滚动到顶部
      if (backgroundContainerRef.current) {
        backgroundContainerRef.current.scrollTop = 0;
      }
    } catch (error) {
      console.error('刷新背景库失败:', error);
    }
  };

  // 将刷新方法挂载到组件实例上
  React.useImperativeHandle(ref, () => ({
    refreshData
  }));

  const handleDeleteBackgroundClick = (background) => {
    setBackgroundToDelete(background);
    setDeleteBackgroundDialogOpen(true);
  };

  const handleDeleteBackgroundClose = () => {
    setDeleteBackgroundDialogOpen(false);
    setBackgroundToDelete(null);
  };

  const handleDeleteBackgroundConfirm = async () => {
    if (!backgroundToDelete) return;

    try {
      await deleteBackground(backgroundToDelete.id);
      fetchData();
      handleDeleteBackgroundClose();
    } catch (error) {
      setError('删除背景失败。请重试。');
      console.error('删除背景错误:', error);
    }
  };

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

  const getBackgroundImageUrl = (background) => {
    return `${API_BASE_URL}/${background.path}`;
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format(DATE_SECOND_FORMAT);
  };

  return (
      <>
      <div ref={backgroundContainerRef} style={{
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 250px)',
        marginBottom: '20px',
        paddingBottom: '30px' // 添加底部内边距
      }}>
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

        <Grid container spacing={3}>
          <InfiniteScrollList
            fetchData={fetchBackgrounds}
            containerRef={backgroundContainerRef}
            // 更新 reloadDeps 依赖项
            reloadDeps={[activeTab, refreshCount]}
            initialData={backgrounds} // 传递初始数据
            renderItem={(background) => (
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
                      {background.name || `背景 ${String(background.id).substring(0, 8)}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      上传于 {formatDate(background.createdAt || new Date())}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ mt: 'auto' }}>
                    {/* <Tooltip title="使用此背景">
                      <IconButton
                        color="primary"
                        size="small"
                      >
                        <Wallpaper />
                      </IconButton>
                    </Tooltip> */}
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
            )}
          />
        </Grid>

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
       </div>
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
       </>
  );
});

export default BackgroundList;
