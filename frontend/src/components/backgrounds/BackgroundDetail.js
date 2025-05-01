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
  Tooltip,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { 
  getBackgroundDetails, 
  deleteBackground,
  getFullUrl
} from '../../services/backgroundService';
import moment from 'moment';
import 'moment/locale/zh-cn';  // 导入中文语言包

// 设置moment为中文
moment.locale('zh-cn');

const BackgroundDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 背景数据状态
  const [background, setBackground] = useState(null);
  
  // 加载状态
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  
  // 错误状态
  const [error, setError] = useState(null);
  
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
  
  // 格式化日期
  const formatDate = (dateString) => {
    return moment(dateString).format('YYYY-MM-DD HH:mm');
  };
  
  // 错误状态处理
  if (!loading && error) {
    return (
      <Container>
        <Box sx={{ mt: 5 }}>
          <Typography color="error" gutterBottom>{error}</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard#backgrounds')}>
            返回仪表盘
          </Button>
        </Box>
      </Container>
    );
  }
  
  // 加载状态处理
  if (loading) {
    return (
      <Container>
        <Box sx={{ 
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
  
  if (!background) {
    return (
      <Container>
        <Box sx={{ mt: 5 }}>
          <Typography gutterBottom>背景不存在或已被删除</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard#backgrounds')}>
            返回仪表盘
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Button
          variant="text"
          startIcon={<BackIcon />}
          onClick={() => navigate('/dashboard#backgrounds')}
          sx={{ mb: 2 }}
        >
          返回仪表盘
        </Button>
        
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {background.backgroundName || '未命名背景'}
            </Typography>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteClick}
            >
              删除背景
            </Button>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              {/* 背景图片预览 */}
              <Card elevation={0} sx={{ mb: 3 }}>
                <CardMedia
                  component="img"
                  image={getFullUrl(background.backgroundUrlPath || background.backgroundPath || '')}
                  alt={background.backgroundName || '背景图片'}
                  sx={{ height: 'auto', maxHeight: 500, objectFit: 'contain' }}
                />
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              {/* 背景信息 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  背景信息
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>上传时间:</strong> {formatDate(background.createdAt)}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>文件大小:</strong> {(background.backgroundSize / 1024).toFixed(2)} KB
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>图片尺寸:</strong> {background.backgroundDim || '未知'}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>使用次数:</strong> {background.backgroundUsageCnt || 0}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>状态:</strong> {background.backgroundStatus === 'exists' ? '可用' : background.backgroundStatus}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <Typography variant="body2"><strong>ID:</strong> </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: '150px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
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
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* 背景使用状态 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  使用状态
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  您可以创建任务使用该背景处理视频。
                </Typography>
              </Box>
              
              {/* 任务按钮 */}
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={() => navigate(`/segment?backgroundId=${id}`)}
              >
                创建视频处理任务
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      
      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除这个背景吗？此操作无法撤销。
            
            {background.backgroundUsageCnt > 0 && (
              <Typography 
                color="error" 
                variant="body2" 
                sx={{ mt: 2, fontWeight: 'bold' }}
              >
                警告：此背景已在 {background.backgroundUsageCnt} 个视频中使用。
                删除它可能会影响这些视频的显示效果。
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            取消
          </Button>
          <Button onClick={handleConfirmDelete} color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={24} /> : '删除'}
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
    </Container>
  );
};

export default BackgroundDetail;

 