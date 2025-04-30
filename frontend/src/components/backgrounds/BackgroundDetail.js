import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  ArrowBack as BackIcon,
  Close as CloseIcon,
  LinkOff as LinkOffIcon,
  Image as ImageIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import { 
  getBackgroundDetails, 
  getBackgroundUsage, 
  updateBackground, 
  deleteBackground,
  incrementBackgroundUsage,
  getFullUrl
} from '../../services/backgroundService';
import { format } from 'date-fns';

// 用于显示多久之前的函数
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " 年前";
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " 个月前";
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " 天前";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " 小时前";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " 分钟前";
  
  return Math.floor(seconds) + " 秒前";
};

const BackgroundDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Tab 状态
  const [activeTab, setActiveTab] = useState(0);
  
  // 背景数据状态
  const [background, setBackground] = useState(null);
  const [usage, setUsage] = useState([]);
  
  // 加载状态
  const [loading, setLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // 错误状态
  const [error, setError] = useState(null);
  const [usageError, setUsageError] = useState(null);
  
  // 编辑状态
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  
  // 对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // 消息提示状态
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 复制状态
  const [copied, setCopied] = useState({
    url: false,
    id: false
  });
  
  // 获取背景详情
  useEffect(() => {
    const fetchBackgroundDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getBackgroundDetails(id);
        
        if (data) {
          setBackground(data);
          // 初始化编辑数据
          setEditedName(data.name || '');
          setEditedDescription(data.description || '');
        } else {
          setError('无法加载背景详情');
        }
      } catch (err) {
        console.error('加载背景详情失败:', err);
        setError('加载背景详情失败: ' + (err.message || '未知错误'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchBackgroundDetails();
  }, [id]);
  
  // 获取使用情况
  useEffect(() => {
    const fetchUsageData = async () => {
      if (!id) return;
      
      try {
        setUsageLoading(true);
        setUsageError(null);
        
        const data = await getBackgroundUsage(id);
        
        if (data && Array.isArray(data)) {
          setUsage(data);
        } else {
          setUsage([]);
        }
      } catch (err) {
        console.error('加载使用情况失败:', err);
        setUsageError('无法加载使用情况: ' + (err.message || '未知错误'));
      } finally {
        setUsageLoading(false);
      }
    };
    
    fetchUsageData();
  }, [id]);
  
  // 处理编辑模式切换
  const handleEditClick = () => {
    setEditing(true);
  };
  
  // 处理编辑输入变化
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setEditedName(value);
    } else if (name === 'description') {
      setEditedDescription(value);
    }
  };
  
  // 保存背景信息
  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      
      const updatedBackground = {
        ...background,
        name: editedName,
        description: editedDescription
      };
      
      const updated = await updateBackground(id, updatedBackground);
      
      if (updated) {
        setBackground(updated);
        
        setSnackbar({
          open: true,
          message: '背景信息已更新',
          severity: 'success'
        });
        
        setEditing(false);
      }
    } catch (err) {
      console.error('保存背景失败:', err);
      setSnackbar({
        open: true,
        message: '保存失败: ' + (err.message || '未知错误'),
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // 打开删除对话框
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };
  
  // 关闭删除对话框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  // 确认删除
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      
      await deleteBackground(id);
      
      setSnackbar({
        open: true,
        message: '背景已成功删除',
        severity: 'success'
      });
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/dashboard#backgrounds');
      }, 1500);
    } catch (err) {
      console.error('删除背景失败:', err);
      setSnackbar({
        open: true,
        message: '删除失败: ' + (err.message || '未知错误'),
        severity: 'error'
      });
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };
  
  // 复制到剪贴板
  const handleCopy = (type, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(prev => ({
        ...prev,
        [type]: true
      }));
      
      // 3秒后重置
      setTimeout(() => {
        setCopied(prev => ({
          ...prev,
          [type]: false
        }));
      }, 3000);
    });
  };
  
  // 处理 Tab 切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // 手动增加使用次数 (调试功能)
  const handleIncrementUsage = async () => {
    try {
      await incrementBackgroundUsage(id);
      
      // 更新显示的使用次数
      setBackground(prev => ({
        ...prev,
        usageCount: (prev.usageCount || 0) + 1
      }));
      
      // 重新加载使用数据
      setUsageLoading(true);
      const data = await getBackgroundUsage(id);
      if (data && Array.isArray(data)) {
        setUsage(data);
      }
      setUsageLoading(false);
      
      setSnackbar({
        open: true,
        message: '使用次数已增加',
        severity: 'success'
      });
    } catch (err) {
      console.error('增加使用次数失败:', err);
      setSnackbar({
        open: true,
        message: '操作失败: ' + (err.message || '未知错误'),
        severity: 'error'
      });
    }
  };
  
  // 错误状态处理
  if (!loading && error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/dashboard#backgrounds')}
            >
              返回背景列表
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }
  
  // 加载状态处理
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          py: 4, 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px' 
        }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* 标题和操作栏 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={() => navigate('/dashboard#backgrounds')}
              aria-label="返回"
            >
              <BackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              背景详情
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {editing ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  取消
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? '保存中...' : '保存'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleEditClick}
                >
                  编辑
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteClick}
                >
                  删除
                </Button>
              </>
            )}
          </Box>
        </Box>
        
        {/* 选项卡 */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab icon={<ImageIcon />} label="基本信息" />
            <Tab icon={<ChartIcon />} label={`使用统计 (${background.usageCount || 0})`} />
          </Tabs>
        </Paper>
        
        {/* 背景详情和使用统计 */}
        {activeTab === 0 ? (
          <Grid container spacing={3}>
            {/* 背景图片预览 */}
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardMedia
                  component="img"
                  image={getFullUrl(background.url)}
                  alt={background.name || '背景图片'}
                  sx={{ 
                    height: 300, 
                    objectFit: 'contain',
                    bgcolor: 'black'
                  }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="body2">图片链接:</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {background.url}
                    </Typography>
                    <Tooltip title={copied.url ? "已复制!" : "复制链接"}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopy('url', background.url)}
                        color={copied.url ? "success" : "default"}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="body2" gutterBottom>
                    图片格式: {background.mimeType || '未知'}
                  </Typography>
                  
                  {background.resolution && (
                    <Typography variant="body2" gutterBottom>
                      分辨率: {background.resolution.width || '?'} x {background.resolution.height || '?'}
                    </Typography>
                  )}
                  
                  {background.fileSize && (
                    <Typography variant="body2" gutterBottom>
                      文件大小: {(background.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </Typography>
                  )}
                  
                  {process.env.NODE_ENV === 'development' && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        调试工具:
                      </Typography>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={handleIncrementUsage}
                        sx={{ mt: 1 }}
                      >
                        增加使用次数
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* 背景信息 */}
            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardContent>
                  {editing ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="背景名称"
                        name="name"
                        value={editedName}
                        onChange={handleEditChange}
                        fullWidth
                        variant="outlined"
                        required
                      />
                      
                      <TextField
                        label="描述"
                        name="description"
                        value={editedDescription}
                        onChange={handleEditChange}
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={4}
                      />
                    </Box>
                  ) : (
                    <>
                      <Typography variant="h5" gutterBottom>
                        {background.name || '未命名背景'}
                      </Typography>
                      
                      {background.description ? (
                        <Typography variant="body1" paragraph>
                          {background.description}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          暂无描述
                        </Typography>
                      )}
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            ID
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                              {background.id}
                            </Typography>
                            <Tooltip title={copied.id ? "已复制!" : "复制ID"}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy('id', background.id)}
                                color={copied.id ? "success" : "default"}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            上传时间
                          </Typography>
                          <Typography variant="body2">
                            {new Date(background.createdAt).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({timeAgo(background.createdAt)})
                          </Typography>
                        </Grid>
                        
                        {background.updatedAt && background.updatedAt !== background.createdAt && (
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              最后更新
                            </Typography>
                            <Typography variant="body2">
                              {new Date(background.updatedAt).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({timeAgo(background.updatedAt)})
                            </Typography>
                          </Grid>
                        )}
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            使用次数
                          </Typography>
                          <Typography variant="body2">
                            {background.usageCount || 0} 次
                          </Typography>
                        </Grid>
                        
                        {background.uploadedBy && (
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              上传用户
                            </Typography>
                            <Typography variant="body2">
                              {background.uploadedBy}
                            </Typography>
                          </Grid>
                        )}
                        
                        {background.tags && background.tags.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              标签
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                              {background.tags.map((tag, index) => (
                                <Chip key={index} label={tag} size="small" />
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                使用统计
              </Typography>
              
              {usageLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : usageError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {usageError}
                </Alert>
              ) : usage.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <LinkOffIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    暂无使用记录
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    该背景尚未在任何视频中使用
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        首次使用时间
                      </Typography>
                      <Typography variant="body1">
                        {new Date(usage[0].timestamp).toLocaleString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        最近使用时间
                      </Typography>
                      <Typography variant="body1">
                        {new Date(usage[usage.length - 1].timestamp).toLocaleString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        总使用次数
                      </Typography>
                      <Typography variant="body1">
                        {usage.length} 次
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    使用历史
                  </Typography>
                  
                  <Box sx={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    mt: 2,
                    pr: 1
                  }}>
                    {usage.map((entry, index) => (
                      <Paper 
                        key={index} 
                        sx={{ 
                          p: 2, 
                          mb: 2, 
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={7}>
                            <Typography variant="body2" color="text.secondary">
                              视频
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {entry.videoName || '未命名视频'}
                            </Typography>
                            
                            {entry.videoId && (
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => navigate(`/videos/${entry.videoId}`)}
                              >
                                查看视频
                              </Button>
                            )}
                          </Grid>
                          
                          <Grid item xs={12} sm={5}>
                            <Typography variant="body2" color="text.secondary">
                              使用时间
                            </Typography>
                            <Typography variant="body1">
                              {new Date(entry.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({timeAgo(entry.timestamp)})
                            </Typography>
                          </Grid>
                          
                          {entry.context && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">
                                使用场景
                              </Typography>
                              <Typography variant="body1">
                                {entry.context}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* 删除确认对话框 */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
        >
          <DialogTitle>删除背景</DialogTitle>
          <DialogContent>
            <DialogContentText>
              您确定要删除背景 "{background.name || '未命名背景'}" 吗？
              
              {background.usageCount > 0 && (
                <Typography 
                  color="error" 
                  variant="body2" 
                  sx={{ mt: 2, fontWeight: 'bold' }}
                >
                  警告：此背景已在 {background.usageCount} 个视频中使用。
                  删除它可能会影响这些视频的显示效果。
                </Typography>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseDeleteDialog} 
              disabled={deleting}
            >
              取消
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              color="error"
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
            >
              {deleting ? '删除中...' : '删除'}
            </Button>
          </DialogActions>
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

export default BackgroundDetail;

 