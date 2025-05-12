import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
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
  LinearProgress,
  Paper,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Alert } from '@mui/material';
import {
  ArrowBack as BackIcon,
  CloudUpload as UploadIcon,
  DeleteOutline as ClearIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Image as ImageIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  CloudDone as DoneIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { 
  uploadBackground, 
  calculateMD5,
  getAllBackgrounds as getUserBackgrounds
} from '../../services/backgroundService';
import { styled } from '@mui/material/styles';
import { UPLOAD_CONFIG } from '../../config';

const MAX_FILE_SIZE = UPLOAD_CONFIG.MAX_BACKGROUND_SIZE;
const ALLOWED_FILE_TYPES = UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES;

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

// 图片预览区域样式
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

// 图片预览显示
const ImagePreview = styled('img')({
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

const BackgroundUpload = ({ onUploadSuccess }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef(null);
  
  // 上传状态
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileHash, setFileHash] = useState('');
  const [existingBackground, setExistingBackground] = useState(null);
  const [backgrounds, setBackgrounds] = useState([]);
  const [isCheckingExistence, setIsCheckingExistence] = useState(false);
  
  // 表单状态
  const [backgroundName, setBackgroundName] = useState('');
  const [backgroundDescription, setBackgroundDescription] = useState('');
  
  // 错误状态
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const [uploadError, setUploadError] = useState('');
  
  // 对话框状态
  const [existsDialogOpen, setExistsDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [uploadedBackground, setUploadedBackground] = useState(null);
  
  // 消息提示状态
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 加载背景库
  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const backgroundsList = await getUserBackgrounds();
        // 确保返回的是数组
        const backgroundsArray = Array.isArray(backgroundsList) 
          ? backgroundsList 
          : (backgroundsList?.backgrounds || []);
        setBackgrounds(backgroundsArray);
      } catch (error) {
        console.error('加载背景库失败:', error);
      }
    };
    
    fetchBackgrounds();
  }, []);
  
  // 验证文件
  const validateFile = (file) => {
    setFileError('');
    
    // 检查文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError(`不支持的文件类型。请上传${UPLOAD_CONFIG.IMAGE_FORMAT_SUPPORT_TEXT}。`);
      return false;
    }
    
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`文件大小超过限制。最大允许 ${MAX_FILE_SIZE / (1024 * 1024)}MB。`);
      return false;
    }
    
    return true;
  };
  
  // 计算文件哈希值
  const calculateFileHash = async (file) => {
    return calculateMD5(file);
  };
  
  // 选择文件时的处理
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (validateFile(file)) {
      // 生成预览URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      setSelectedFile(file);
      
      // 根据文件名设置默认背景名称
      const fileName = file.name.split('.')[0];
      if (!backgroundName) {
        setBackgroundName(fileName);
      }
      
      // 计算文件哈希值并检查是否存在
      setIsCheckingExistence(true);
      setFileError('');
      
      try {
        const hash = await calculateFileHash(file);
        setFileHash(hash);
        
        // 在本地背景库中检查是否存在相同MD5的背景
        const existingBg = backgrounds.find(bg => 
          bg.backgroundMd5 === hash && bg.backgroundStatus === 'exists'
        );
        
        if (existingBg) {
          setExistingBackground(existingBg);
          setFileError(`背景库中已存在相同的图片（${existingBg.backgroundName || '未命名背景'}），请勿重复上传。`);
          setExistsDialogOpen(true);
        }
      } catch (err) {
        console.error('计算文件哈希值失败:', err);
        // 忽略检查错误，继续上传流程
      } finally {
        setIsCheckingExistence(false);
      }
    }
    
    // 重置文件输入以便重新选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 清除已选文件
  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setFileHash('');
    setFileError('');
    setUploadProgress(0);
    
    // 重置文件输入以便重新选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 上传背景图片
  const handleUpload = async () => {
    setFormError('');
    setUploadError('');
    
    // 表单校验
    if (!selectedFile) {
      setFormError('请选择背景图片');
      return;
    }
    
    if (!backgroundName.trim()) {
      setFormError('请输入背景名称');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + Math.random() * 10;
          return prev;
        });
      }, 200);
      
      // 直接传递文件、名称和进度回调给 uploadBackground 函数
      const response = await uploadBackground(
        selectedFile, 
        backgroundName.trim(),
        (progress) => setUploadProgress(progress)
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      console.log('上传成功，响应数据:', response);
      
      // 处理响应
      if (response && response.background && response.background.id) {
        // 上传成功 - 使用正确的响应数据格式
        const background = response.background;
        
        // 处理预览URL
        const backgroundWithUrl = {
          ...background,
          url: background.backgroundUrlPath ? background.backgroundUrlPath : background.backgroundPath
        };
        
        console.log('处理后的背景数据:', backgroundWithUrl);
        setUploadedBackground(backgroundWithUrl);
        
        // 如果有成功回调，则调用
        if (typeof onUploadSuccess === 'function') {
          onUploadSuccess(backgroundWithUrl);
        } else {
          // 否则显示成功对话框
          setSuccessDialogOpen(true);
        }
        
        // 重置表单
        handleClearFile();
        setBackgroundName('');
        setBackgroundDescription('');
      } else {
        throw new Error('服务器返回的背景数据格式不正确');
      }
    } catch (error) {
      console.error('上传背景出错:', error);
      setUploadError(error.message || '上传失败，请重试');
      setSnackbar({
        open: true,
        message: `上传失败: ${error.message || '未知错误'}`,
        severity: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // 关闭"已存在"对话框
  const handleCloseExistsDialog = () => {
    setExistsDialogOpen(false);
  };
  
  // 使用已存在的背景
  const handleUseExisting = () => {
    setExistsDialogOpen(false);
    if (existingBackground && existingBackground.id) {
      navigate(`/dashboard#backgrounds/${existingBackground.id}`);
    }
  };
  
  // 关闭"上传成功"对话框
  const handleCloseSuccessDialog = () => {
    setSuccessDialogOpen(false);
  };
  
  // 在上传成功后查看背景
  const handleViewUploadedBackground = () => {
    setSuccessDialogOpen(false);
    if (uploadedBackground && uploadedBackground.id) {
      navigate(`/dashboard#backgrounds/${uploadedBackground.id}`);
    }
  };
  
  // 在上传成功后返回列表
  const handleBackToList = () => {
    setSuccessDialogOpen(false);
    navigate('/dashboard#backgrounds');
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* 上传表单 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* 文件选择区域 */}
          <PreviewBox>
            {previewUrl ? (
              <>
                <ImagePreview src={previewUrl} alt="背景预览" />
                <ClearButton onClick={handleClearFile}>
                  <ClearIcon />
                </ClearButton>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <AddPhotoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
                  选择背景图片
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  支持 JPEG, PNG 和 WebP 格式，最大 10MB
                </Typography>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={isCheckingExistence ? <CircularProgress size={24} /> : <UploadIcon />}
                  sx={{ mt: 1 }}
                  disabled={isCheckingExistence}
                >
                  {isCheckingExistence ? '检查中...' : '选择图片'}
                  <VisuallyHiddenInput 
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
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
          
          {selectedFile && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                文件信息
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    文件名: {selectedFile.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    大小: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Grid>
                {fileHash && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      MD5: {fileHash}
      </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          {/* 表单区域 */}
        <TextField
          fullWidth
            label="背景名称"
          value={backgroundName}
          onChange={(e) => setBackgroundName(e.target.value)}
            margin="normal"
            required
            error={formError === '请输入背景名称'}
            helperText={formError === '请输入背景名称' ? formError : ''}
          />
          
          <TextField
            fullWidth
            label="描述（可选）"
            value={backgroundDescription}
            onChange={(e) => setBackgroundDescription(e.target.value)}
            margin="normal"
            multiline
            rows={4}
          />
          
          {formError && formError !== '请输入背景名称' && (
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
              disabled={!selectedFile || isUploading || !backgroundName.trim() || !!fileError || isCheckingExistence}
              fullWidth
            >
              {isUploading ? '上传中...' : '上传背景'}
        </Button>
      </Box>
      
          {isUploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {uploadProgress.toFixed(0)}%
          </Typography>
        </Box>
      )}
        </Grid>
      </Grid>
      
      {/* 背景已存在对话框 */}
      <Dialog
        open={existsDialogOpen}
        onClose={handleCloseExistsDialog}
        aria-labelledby="exists-dialog-title"
      >
        <DialogTitle>相同背景已存在</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DoneIcon color="success" sx={{ mr: 1 }} />
            <Typography variant="body1">
              系统中已存在相同的背景图片。
            </Typography>
          </Box>
          
          {existingBackground && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <img
                    src={existingBackground.url}
                    alt="已存在的背景"
                    style={{ width: '100%', height: 'auto' }}
                  />
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="subtitle1">
                    {existingBackground.name || '未命名背景'}
                  </Typography>
                  {existingBackground.description && (
                    <Typography variant="body2" color="text.secondary">
                      {existingBackground.description}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    上传时间: {new Date(existingBackground.createdAt).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <LinkIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      使用次数: {existingBackground.usageCount || 0}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
          
          <DialogContentText sx={{ mt: 2 }}>
            您可以使用已存在的背景或继续上传新副本。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExistsDialog}>
            继续上传
          </Button>
          <Button
            variant="contained"
            onClick={handleUseExisting}
            autoFocus
          >
            使用已有背景
          </Button>
        </DialogActions>
      </Dialog>
      
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
              背景已成功上传
            </Typography>
            
            {uploadedBackground && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2, textAlign: 'left' }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    {uploadedBackground.url ? (
                      <img
                        src={uploadedBackground.url}
                        alt="已上传的背景"
                        style={{ width: '100%', height: 'auto' }}
                      />
                    ) : (
                      <Box sx={{ 
                        width: '100%', 
                        height: 100, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'grey.200' 
                      }}>
                        <ImageIcon color="disabled" />
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="subtitle1">
                      {uploadedBackground.backgroundName || uploadedBackground.name || '未命名背景'}
                    </Typography>
                    {uploadedBackground.description && (
                      <Typography variant="body2" color="text.secondary">
                        {uploadedBackground.description}
      </Typography>
                    )}
                  </Grid>
                </Grid>
    </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBackToList}>
            返回列表
          </Button>
          <Button
            variant="contained"
            onClick={handleViewUploadedBackground}
            autoFocus
          >
            查看背景
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

// 横纵比图标
const AspectRatioIcon = (props) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
    <path 
      fill="currentColor" 
      d="M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z" 
    />
  </svg>
);

export default BackgroundUpload; 