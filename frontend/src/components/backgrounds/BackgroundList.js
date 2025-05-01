import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Checkbox,
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
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Alert } from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
  PhotoLibrary as PhotoIcon,
  Check as CheckIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { getUserBackgrounds, deleteBackground, getFullUrl } from '../../services/backgroundService';
import BackgroundUpload from './BackgroundUpload'; // 导入上传组件

// 定义每页显示数量
const ITEMS_PER_PAGE = 12;

const BackgroundList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // 状态管理
  const [backgrounds, setBackgrounds] = useState([]);
  const [filteredBackgrounds, setFilteredBackgrounds] = useState([]);
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
  
  // 加载背景
  const loadBackgrounds = async (isRefresh = false) => {
    if (isRefresh) {
      setPage(1);
      setLoading(true);
    }
    
    try {
      setError(null);
      console.log('开始请求背景数据...');
      
      // 调用API获取背景数据
      const data = await getUserBackgrounds();
      
      // 详细日志输出，以便调试
      console.log('API返回的背景数据:', data);
      console.log('数据类型:', typeof data);
      console.log('是否为数组:', Array.isArray(data));
      
      if (data) {
        // 确保数据是数组格式
        const backgroundList = Array.isArray(data) ? data : (data.backgrounds || []);
        
        // 检查第一个背景对象的属性
        if (backgroundList.length > 0) {
          console.log('第一个背景对象属性:', Object.keys(backgroundList[0]));
          console.log('背景示例:', backgroundList[0]);
        }
        
        setBackgrounds(backgroundList);
        // 初始应用筛选和排序
        applyFiltersAndSort(backgroundList, searchTerm, sortOption);
      } else {
        console.log('无背景数据返回');
        setBackgrounds([]);
        setFilteredBackgrounds([]);
      }
    } catch (err) {
      console.error('加载背景失败:', err);
      setError('无法加载您的背景图片: ' + (err.message || '未知错误'));
      setBackgrounds([]);
      setFilteredBackgrounds([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 应用筛选和排序
  const applyFiltersAndSort = (items, search, sort) => {
    // 首先过滤出可用的背景
    let filtered = items.filter(item => item.backgroundStatus === 'exists' || item.status === 'exists' || !item.backgroundStatus);
    
    // 筛选
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(item => 
        (item.name && item.name.toLowerCase().includes(searchLower)) || 
        (item.description && item.description.toLowerCase().includes(searchLower))
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
          (a.name || '').localeCompare(b.name || '')
        );
        break;
      case 'name_desc':
        filtered = [...filtered].sort((a, b) => 
          (b.name || '').localeCompare(a.name || '')
        );
        break;
      case 'most_used':
        filtered = [...filtered].sort((a, b) => 
          (b.usageCount || 0) - (a.usageCount || 0)
        );
        break;
      default:
        break;
    }
    
    setFilteredBackgrounds(filtered);
    
    // 检查是否有更多页
    setHasMore(filtered.length > page * ITEMS_PER_PAGE);
  };
  
  // 初始加载
  useEffect(() => {
    loadBackgrounds();
  }, []);
  
  // 当搜索或排序变化时重新过滤
  useEffect(() => {
    applyFiltersAndSort(backgrounds, searchTerm, sortOption);
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
    if (selectedItems.length === filteredBackgrounds.length) {
      setSelectedItems([]); // 如果所有都被选中，则取消全选
    } else {
      setSelectedItems(filteredBackgrounds.map(item => item.id)); // 否则全选
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
        const deletePromises = selectedItems.map(id => deleteBackground(id));
        await Promise.all(deletePromises);
        
        // 更新状态
        setBackgrounds(prevBackgrounds => 
          prevBackgrounds.filter(bg => !selectedItems.includes(bg.id))
        );
        
        setFilteredBackgrounds(prevFiltered => 
          prevFiltered.filter(bg => !selectedItems.includes(bg.id))
        );
        
        setSelectedItems([]);
        setSelectMode(false);
        
        setSnackbar({
          open: true,
          message: `已成功删除 ${selectedItems.length} 个背景`,
          severity: 'success'
        });
      } else if (deleteItem) {
        // 单个删除
        await deleteBackground(deleteItem.id);
        
        // 更新状态
        setBackgrounds(prevBackgrounds => 
          prevBackgrounds.filter(bg => bg.id !== deleteItem.id)
        );
        
        setFilteredBackgrounds(prevFiltered => 
          prevFiltered.filter(bg => bg.id !== deleteItem.id)
        );
        
        setSnackbar({
          open: true,
          message: `背景 "${deleteItem.name || '未命名'}" 已成功删除`,
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('删除背景失败:', err);
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
  const handleUploadSuccess = (uploadedBackground) => {
    setUploadDialogOpen(false);
    // 刷新背景列表
    loadBackgrounds(true);
    // 显示成功消息
    setSnackbar({
      open: true,
      message: '背景上传成功',
      severity: 'success'
    });
  };
  
  // 导航到背景详情页面
  const handleViewBackground = (id) => {
    navigate(`/backgrounds/${id}`);
  };
  
  // 计算当前页显示的背景
  const displayedBackgrounds = filteredBackgrounds.slice(0, page * ITEMS_PER_PAGE);
  
  // 是否显示"全选"
  const showSelectAll = filteredBackgrounds.length > 0 && selectMode;
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* 标题和操作栏 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            背景图片库
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
                  上传背景
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
                placeholder="搜索背景..."
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
                <MenuItem value="most_used">最常使用</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          
          {showSelectAll && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selectedItems.length === filteredBackgrounds.length}
                    indeterminate={selectedItems.length > 0 && selectedItems.length < filteredBackgrounds.length}
                    onChange={handleSelectAll}
                  />
                }
                label={`全选 (${filteredBackgrounds.length} 项)`}
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
        {!loading && !error && backgrounds.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <PhotoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              您还没有上传任何背景
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              上传背景图片以便在视频中使用
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleUploadClick}
              size="large"
              sx={{ mt: 2 }}
            >
              上传第一张背景
            </Button>
          </Paper>
        )}
        
        {/* 搜索无结果 */}
        {!loading && !error && backgrounds.length > 0 && filteredBackgrounds.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              未找到匹配的背景
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
        
        {/* 背景列表 */}
        {!loading && !error && displayedBackgrounds.length > 0 && (
          <>
            <Grid container spacing={3}>
              {displayedBackgrounds.map((background) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={background.id}>
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
                      border: selectedItems.includes(background.id) ? 2 : 0,
                      borderColor: 'primary.main',
                      cursor: selectMode ? 'pointer' : 'default'
                    }}
                    onClick={() => selectMode && handleSelectItem(background.id)}
                  >
                    {/* 选择复选框 */}
                    {selectMode && (
                      <Checkbox
                        checked={selectedItems.includes(background.id)}
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
                          handleSelectItem(background.id);
                        }}
                      />
                    )}
                    
                    {/* 背景图片 */}
                    <CardMedia
                      component="img"
                      image={getFullUrl(background.backgroundUrlPath || background.backgroundPath || background.path || background.url || '')}
                      alt={(background.backgroundName || background.name) || '背景图片'}
                      sx={{ 
                        height: 180, 
                        objectFit: 'cover',
                        cursor: selectMode ? 'pointer' : 'pointer'
                      }}
                      onClick={(e) => {
                        if (!selectMode) {
                          e.stopPropagation();
                          handleViewBackground(background.id);
                        }
                      }}
                    />
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" noWrap title={background.backgroundName || background.name}>
                        {background.backgroundName || background.name || '未命名背景'}
                      </Typography>
                      
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>创建时间:</strong> {new Date(background.createdAt).toLocaleDateString()}
                        </Typography>
                        
                        {background.backgroundDim && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>尺寸:</strong> {background.backgroundDim}
                          </Typography>
                        )}
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>使用次数:</strong> {background.backgroundUsageCnt || background.usageCount || 0}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">
                          <strong>状态:</strong> {background.backgroundStatus === 'exists' ? '可用' : background.backgroundStatus || '未知'}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewBackground(background.id);
                        }}
                        disabled={selectMode}
                      >
                        查看详情
                      </Button>
                      <Box sx={{ flexGrow: 1 }} />
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick({
                            id: background.id,
                            name: background.backgroundName || background.name || '未命名背景',
                            usageCount: background.backgroundUsageCnt || background.usageCount || 0
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
            {bulkDeleteMode ? '批量删除背景' : '删除背景'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {bulkDeleteMode 
                ? `您确定要删除选中的 ${selectedItems.length} 个背景吗？` 
                : `您确定要删除背景 "${deleteItem?.name || '未命名背景'}" 吗？`
              }
              
              {(bulkDeleteMode || (deleteItem && deleteItem.usageCount > 0)) && (
                <Typography 
                  color="error" 
                  variant="body2" 
                  sx={{ mt: 2, fontWeight: 'bold' }}
                >
                  警告：该操作不可撤销，如果背景正在被视频使用，删除可能会影响相关视频。
                </Typography>
              )}
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
        
        {/* 背景上传对话框 */}
        <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          fullWidth
          maxWidth="md"
          aria-labelledby="upload-dialog-title"
        >
          <DialogTitle id="upload-dialog-title">
            上传背景图片
            <IconButton
              aria-label="close"
              onClick={() => setUploadDialogOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <BackgroundUpload onUploadSuccess={handleUploadSuccess} />
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

export default BackgroundList; 