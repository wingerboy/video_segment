import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { Alert } from '@mui/material';
import {
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
  Movie as MovieIcon,
  Check as CheckIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  MovieFilter as MovieFilterIcon
} from '@mui/icons-material';
import {
  getAllVideos,
  deleteVideo,
  getFullUrl
} from '../../services/videoService';
import VideoUpload from './VideoUpload';
import dayjs from 'dayjs';
import { DATE_SECOND_FORMAT } from '../../constants/index.ts';

// 定义每页显示数量
const ITEMS_PER_PAGE = 12;

const statusColors = {
  exists: 'success',
  waiting: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
  deleted: 'default'
};

const statusTranslations = {
  exists: '可用',
  waiting: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
  deleted: '已删除'
};

const VideoList = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // 多选操作状态
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // 删除对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  
  // 消息提示状态
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 上传对话框状态
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // 加载视频
  const loadVideos = async (isRefresh = false) => {
    if (isRefresh) {
      setPage(1);
      setLoading(true);
    }
    
    try {
      setError(null);
      console.log('开始请求视频数据...');
      
      // 调用API获取视频数据
      const data = await getAllVideos();
      
      // 详细日志输出，以便调试
      console.log('API返回的视频数据:', data);
      
      if (data) {
        // 确保数据是数组格式
        const videoList = Array.isArray(data) ? data : (data.videos || []);
        
        setVideos(videoList);
        // 初始应用筛选和排序
        applyFiltersAndSort(videoList, searchTerm, sortOption);
      } else {
        console.log('无视频数据返回');
        setVideos([]);
        setFilteredVideos([]);
      }
    } catch (err) {
      console.error('加载视频失败:', err);
      setError('无法加载您的视频: ' + (err.message || '未知错误'));
      setVideos([]);
      setFilteredVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // 应用筛选和排序
  const applyFiltersAndSort = (items, search, sort) => {
    // 首先过滤出可用的视频
    let filtered = items.filter(item => item.oriVideoStatus === 'exists');
    
    // 筛选
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(item => 
        (item.oriVideoName && item.oriVideoName.toLowerCase().includes(searchLower)) || 
        (item.name && item.name.toLowerCase().includes(searchLower))
      );
    }
    
    // 排序
    switch (sort) {
      case 'newest':
        filtered = [...filtered].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case 'oldest':
        filtered = [...filtered].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
      case 'name_asc':
        filtered = [...filtered].sort((a, b) => 
          (a.oriVideoName || a.name || '').localeCompare(b.oriVideoName || b.name || '')
        );
        break;
      case 'name_desc':
        filtered = [...filtered].sort((a, b) => 
          (b.oriVideoName || b.name || '').localeCompare(a.oriVideoName || a.name || '')
        );
        break;
      case 'size_desc':
        filtered = [...filtered].sort((a, b) => 
          (b.oriVideoSize || 0) - (a.oriVideoSize || 0)
        );
        break;
      case 'duration_desc':
        filtered = [...filtered].sort((a, b) => 
          (b.oriVideoDuration || 0) - (a.oriVideoDuration || 0)
        );
        break;
      default:
        break;
    }
    
    setFilteredVideos(filtered);
    
    // 检查是否有更多页
    setHasMore(filtered.length > page * ITEMS_PER_PAGE);
  };
  
  // 初始加载
  useEffect(() => {
    loadVideos();
  }, []);
  
  // 当搜索或排序变化时重新过滤
  useEffect(() => {
    applyFiltersAndSort(videos, searchTerm, sortOption);
    // 重置页码
    setPage(1);
  }, [searchTerm, sortOption]);
  
  // 处理搜索输入
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // 清除搜索
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  // 处理排序变化
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };
  
  // 加载更多
  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };
  
  // 切换选择模式
  const handleToggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedItems([]);
  };
  
  // 选择/取消选择单个项目
  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };
  
  // 选择/取消选择所有项目
  const handleSelectAll = () => {
    if (selectedItems.length === filteredVideos.length) {
      setSelectedItems([]); // 如果所有都被选中，则取消全选
    } else {
      setSelectedItems(filteredVideos.map(item => item.id)); // 否则全选
    }
  };
  
  // 打开删除对话框（单个项目）
  const handleDeleteClick = (item) => {
    setDeleteItem(item);
    setBulkDeleteMode(false);
    setDeleteDialogOpen(true);
  };
  
  // 打开批量删除对话框
  const handleBulkDeleteClick = () => {
    setBulkDeleteMode(true);
    setDeleteDialogOpen(true);
  };
  
  // 关闭删除对话框
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteItem(null);
    setIsDeleting(false);
  };
  
  // 确认删除（单个或批量）
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    
    try {
      if (bulkDeleteMode) {
        // 批量删除
        const deletePromises = selectedItems.map(id => deleteVideo(id));
        await Promise.all(deletePromises);
        
        // 更新状态
        setVideos(prevVideos => 
          prevVideos.filter(v => !selectedItems.includes(v.id))
        );
        
        setFilteredVideos(prevFiltered => 
          prevFiltered.filter(v => !selectedItems.includes(v.id))
        );
        
        setSelectedItems([]);
        setSelectMode(false);
        
        setSnackbar({
          open: true,
          message: `已成功删除 ${selectedItems.length} 个视频`,
          severity: 'success'
        });
      } else if (deleteItem) {
        // 单个删除
        await deleteVideo(deleteItem.id);
        
        // 更新状态
        setVideos(prevVideos => 
          prevVideos.filter(v => v.id !== deleteItem.id)
        );
        
        setFilteredVideos(prevFiltered => 
          prevFiltered.filter(v => v.id !== deleteItem.id)
        );
        
        setSnackbar({
          open: true,
          message: `视频 "${deleteItem.name || '未命名'}" 已成功删除`,
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('删除视频失败:', err);
      setSnackbar({
        open: true,
        message: `删除失败: ${err.message || '未知错误'}`,
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteItem(null);
      setIsDeleting(false);
    }
  };
  
  // 打开上传对话框而不是导航到上传页面
  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };
  
  // 上传成功后的回调
  const handleUploadSuccess = (uploadedVideo) => {
    setUploadDialogOpen(false);
    // 刷新视频列表
    loadVideos(true);
    // 显示成功消息
    setSnackbar({
      open: true,
      message: '视频上传成功',
      severity: 'success'
    });
  };
  
  // 导航到视频详情页面
  const handleViewVideo = (id) => {
    navigate(`/videos/${id}`);
  };
  
  // 导航到视频处理页面
  const handleProcessVideo = (id) => {
    navigate(`/segment?videoId=${id}`);
  };
  
  // 计算当前页显示的视频
  const displayedVideos = filteredVideos.slice(0, page * ITEMS_PER_PAGE);
  
  // 是否显示"全选"
  const showSelectAll = filteredVideos.length > 0 && selectMode;
  
  // 获取视频缩略图
  const getVideoThumbnail = (video) => {
    const path = video.oriVideoPath || video.path;
    return path ? getFullUrl(path) : '';
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    return dayjs(dateString).format(DATE_SECOND_FORMAT);
  };
  
    return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* 标题和操作栏 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            视频库
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectMode ? (
              <>
              <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleToggleSelectMode}
                  startIcon={<ClearIcon />}
                >
                  取消选择
              </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleBulkDeleteClick}
                  startIcon={<DeleteIcon />}
                  disabled={selectedItems.length === 0}
                >
                  删除所选 ({selectedItems.length})
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleToggleSelectMode}
                  startIcon={<CheckIcon />}
                >
                  选择
                </Button>
            <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUploadClick}
                  startIcon={<UploadIcon />}
            >
              上传视频
            </Button>
              </>
            )}
          </Box>
        </Box>
        
        {/* 筛选和搜索工具栏 */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="搜索视频..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="排序方式"
                value={sortOption}
                onChange={handleSortChange}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SortIcon />
                    </InputAdornment>
                  )
                }}
              >
                <MenuItem value="newest">最新上传</MenuItem>
                <MenuItem value="oldest">最早上传</MenuItem>
                <MenuItem value="name_asc">名称 (A-Z)</MenuItem>
                <MenuItem value="name_desc">名称 (Z-A)</MenuItem>
                <MenuItem value="size_desc">大小 (降序)</MenuItem>
                <MenuItem value="duration_desc">时长 (降序)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          
          {showSelectAll && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selectedItems.length === filteredVideos.length}
                    indeterminate={selectedItems.length > 0 && selectedItems.length < filteredVideos.length}
                    onChange={handleSelectAll}
                  />
                }
                label={`全选 (${filteredVideos.length} 项)`}
              />
                      </Box>
          )}
        </Paper>
        
        {/* 加载中状态 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* 错误状态 */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* 空状态 */}
        {!loading && !error && videos.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <MovieIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              您还没有上传任何视频
          </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              上传视频以便进行背景分割处理
          </Typography>
          <Button
            variant="contained"
            color="primary"
              startIcon={<UploadIcon />}
              onClick={handleUploadClick}
              size="large"
              sx={{ mt: 2 }}
            >
              上传第一个视频
          </Button>
          </Paper>
        )}
        
        {/* 搜索无结果 */}
        {!loading && !error && videos.length > 0 && filteredVideos.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              未找到匹配的视频
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              尝试使用不同的搜索词或清除筛选条件
            </Typography>
        <Button
              variant="outlined"
              onClick={handleClearSearch}
              startIcon={<ClearIcon />}
            >
              清除搜索
        </Button>
          </Paper>
        )}
        
        {/* 视频列表 */}
        {!loading && !error && displayedVideos.length > 0 && (
          <>
        <Grid container spacing={3}>
              {displayedVideos.map((video) => (
                <Grid item xs={12} sm={6} md={4} key={video.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: selectMode ? 'none' : 'translateY(-4px)',
                        boxShadow: selectMode ? 3 : 6
                      },
                      border: selectedItems.includes(video.id) ? 2 : 0,
                      borderColor: 'primary.main',
                      cursor: selectMode ? 'pointer' : 'default'
                    }}
                    onClick={() => selectMode && handleSelectItem(video.id)}
                  >
                    {/* 选择复选框 */}
                    {selectMode && (
                      <Checkbox
                        checked={selectedItems.includes(video.id)}
                    sx={{
                          position: 'absolute', 
                          top: 4, 
                          left: 4, 
                          zIndex: 1,
                          background: 'rgba(255,255,255,0.7)',
                          borderRadius: '50%',
                          padding: '4px',
                          '&:hover': { background: 'rgba(255,255,255,0.9)' }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectItem(video.id);
                        }}
                      />
                    )}
                    
                    {/* 视频缩略图 */}
                    <CardMedia
                      component="video"
                      height="180"
                      src={getVideoThumbnail(video)}
                      alt={(video.oriVideoName || video.name) || '视频'}
                      sx={{ 
                        objectFit: 'cover',
                        cursor: selectMode ? 'pointer' : 'pointer'
                      }}
                      onClick={(e) => {
                        if (!selectMode) {
                          e.stopPropagation();
                          handleViewVideo(video.id);
                        }
                      }}
                    />
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" noWrap title={video.oriVideoName || video.name}>
                        {video.oriVideoName || video.name || `视频 ${video.id}`}
              </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Chip
                          label={statusTranslations[video.oriVideoStatus] || video.oriVideoStatus}
                          color={statusColors[video.oriVideoStatus] || 'default'}
                  size="small"
                          sx={{ mr: 1 }}
                        />
                        
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(video.createdAt)}
                        </Typography>
        </Box>

                      <Box sx={{ mt: 1 }}>
                        {video.oriVideoDim && (
                          <Typography variant="body2" color="text.secondary">
                            分辨率: {video.oriVideoDim}
            </Typography>
                        )}
                        {video.oriVideoDuration && (
                          <Typography variant="body2" color="text.secondary">
                            时长: {video.oriVideoDuration}秒
            </Typography>
                        )}
                        {video.oriVideoSize && (
                    <Typography variant="body2" color="text.secondary">
                            大小: {video.oriVideoSize}MB
                    </Typography>
                        )}
                      </Box>
                  </CardContent>
                    
                    <CardActions>
                      <Button 
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewVideo(video.id);
                        }}
                        disabled={selectMode}
                      >
                        查看
                      </Button>
                    <Button
                      size="small"
                        startIcon={<MovieFilterIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProcessVideo(video.id);
                        }}
                        disabled={selectMode}
                      >
                        分割
                    </Button>
                      <Box sx={{ flexGrow: 1 }} />
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick({
                            id: video.id,
                            name: video.oriVideoName || video.name || `视频 ${video.id}`
                          });
                        }}
                        disabled={selectMode}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
            
            {/* 加载更多按钮 */}
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
                  variant="outlined" 
                  onClick={handleLoadMore} 
                  size="large"
                >
                  加载更多
            </Button>
          </Box>
            )}
          </>
        )}
        
        {/* 删除确认对话框 */}
        <Dialog
          open={deleteDialogOpen}
          onClose={!isDeleting ? handleDeleteCancel : undefined}
          aria-labelledby="delete-dialog-title"
        >
          <DialogTitle id="delete-dialog-title">
            {bulkDeleteMode ? '批量删除视频' : '删除视频'}
          </DialogTitle>
        <DialogContent>
          <DialogContentText>
              {bulkDeleteMode 
                ? `您确定要删除选中的 ${selectedItems.length} 个视频吗？` 
                : `您确定要删除视频 "${deleteItem?.name || '未命名视频'}" 吗？`
              }
              
              <Typography 
                color="error" 
                variant="body2" 
                sx={{ mt: 2, fontWeight: 'bold' }}
              >
                警告：此操作不可撤销，删除后视频数据将永久丢失。
              </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button 
              onClick={handleDeleteCancel} 
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
            >
              {isDeleting ? '删除中...' : '删除'}
          </Button>
        </DialogActions>
      </Dialog>

        {/* 视频上传对话框 */}
      <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          fullWidth
          maxWidth="md"
          aria-labelledby="upload-dialog-title"
        >
          <DialogTitle id="upload-dialog-title">
            上传视频
            <IconButton
              aria-label="close"
              onClick={() => setUploadDialogOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <VideoUpload onUploadSuccess={handleUploadSuccess} />
          </DialogContent>
      </Dialog>
        
        {/* 消息提示 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default VideoList;
