import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Refresh as RefreshIcon, 
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { 
  getAllInterfaces, 
  addInterface, 
  updateInterfaceStatus,
  deleteInterface,
  getAllModels,
  addModel,
  updateModel,
  deleteModel
} from '../services/adminService';

// TabPanel组件，用于切换不同Tab内容
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`service-tabpanel-${index}`}
      aria-labelledby={`service-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AIServiceManagement = () => {
  const [interfaces, setInterfaces] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // 接口对话框状态
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editInterfaceItem, setEditInterfaceItem] = useState(null);
  
  // 模型对话框状态
  const [openAddModelDialog, setOpenAddModelDialog] = useState(false);
  const [openEditModelDialog, setOpenEditModelDialog] = useState(false);
  const [editModelItem, setEditModelItem] = useState(null);
  
  // 接口表单数据
  const [formData, setFormData] = useState({
    interfaceAddress: '',
    isActive: true
  });
  
  // 模型表单数据
  const [modelFormData, setModelFormData] = useState({
    modelName: '',
    modelAlias: '',
    modelDescription: ''
  });

  // 加载数据
  useEffect(() => {
    if (tabValue === 0) {
      fetchInterfaces();
    } else {
      fetchModels();
    }
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // ============= 接口管理相关函数 =============
  const fetchInterfaces = async () => {
    try {
      setLoading(true);
      const data = await getAllInterfaces();
      setInterfaces(data);
      setError('');
    } catch (error) {
      console.error('获取接口数据失败:', error);
      setError('获取接口数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setFormData({
      interfaceAddress: '',
      isActive: true
    });
    setOpenAddDialog(true);
  };

  const handleEditInterfaceItem = (interfaceItem) => {
    setEditInterfaceItem(interfaceItem);
    setFormData({
      interfaceAddress: interfaceItem.interfaceAddress,
      isActive: interfaceItem.status === 'idle' || interfaceItem.status === 'busy'
    });
    setOpenEditDialog(true);
  };

  const handleFormChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value
    }));
  };

  const handleSubmitAdd = async () => {
    if (!formData.interfaceAddress.trim()) {
      setError('接口地址不能为空');
      return;
    }

    try {
      setLoading(true);
      console.log('准备添加接口:', formData);
      const response = await addInterface(formData.interfaceAddress, formData.isActive);
      console.log('添加接口成功:', response);
      await fetchInterfaces();
      setOpenAddDialog(false);
    } catch (error) {
      console.error('添加接口详细错误:', error);
      setError(`添加接口失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!formData.interfaceAddress.trim()) {
      setError('接口地址不能为空');
      return;
    }

    try {
      setLoading(true);
      
      // 如果接口地址有变化，则需要添加新接口
      if (formData.interfaceAddress !== editInterfaceItem.interfaceAddress) {
        await addInterface(formData.interfaceAddress, formData.isActive);
      } 
      // 如果只是状态变化，则更新状态
      else if ((formData.isActive ? 'idle' : 'offline') !== editInterfaceItem.status) {
        await updateInterfaceStatus(
          editInterfaceItem.id, 
          formData.isActive ? 'idle' : 'offline'
        );
      }
      
      await fetchInterfaces();
      setOpenEditDialog(false);
    } catch (error) {
      console.error('更新接口详细错误:', error);
      setError(`更新接口失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'idle': return 'success';
      case 'busy': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'idle': return '空闲';
      case 'busy': return '忙碌';
      case 'offline': return '禁用';
      default: return status;
    }
  };

  // ============= 模型管理相关函数 =============
  const fetchModels = async () => {
    try {
      setLoading(true);
      const data = await getAllModels();
      setModels(data);
      setError('');
    } catch (error) {
      console.error('获取模型数据失败:', error);
      setError('获取模型数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModelDialog = () => {
    setModelFormData({
      modelName: '',
      modelAlias: '',
      modelDescription: ''
    });
    setOpenAddModelDialog(true);
  };

  const handleEditModelItem = (model) => {
    setEditModelItem(model);
    setModelFormData({
      modelName: model.modelName,
      modelAlias: model.modelAlias || '',
      modelDescription: model.modelDescription || ''
    });
    setOpenEditModelDialog(true);
  };

  const handleModelFormChange = (e) => {
    const { name, value } = e.target;
    setModelFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAddModel = async () => {
    if (!modelFormData.modelName.trim()) {
      setError('模型名称不能为空');
      return;
    }

    try {
      setLoading(true);
      await addModel(modelFormData);
      await fetchModels();
      setOpenAddModelDialog(false);
    } catch (error) {
      console.error('添加模型失败:', error);
      setError(`添加模型失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEditModel = async () => {
    if (!modelFormData.modelName.trim()) {
      setError('模型名称不能为空');
      return;
    }

    try {
      setLoading(true);
      await updateModel(editModelItem.id, modelFormData);
      await fetchModels();
      setOpenEditModelDialog(false);
    } catch (error) {
      console.error('更新模型失败:', error);
      setError(`更新模型失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (!window.confirm('确定要删除这个模型吗？')) {
      return;
    }

    try {
      setLoading(true);
      await deleteModel(modelId);
      await fetchModels();
    } catch (error) {
      console.error('删除模型失败:', error);
      setError(`删除模型失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInterface = async (interfaceId) => {
    if (!window.confirm('确定要删除这个接口吗？')) {
      return;
    }

    try {
      setLoading(true);
      await deleteInterface(interfaceId);
      await fetchInterfaces();
    } catch (error) {
      console.error('删除接口失败:', error);
      setError(`删除接口失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI服务管理
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="AI服务管理选项卡">
            <Tab label="接口管理" id="service-tab-0" aria-controls="service-tabpanel-0" />
            <Tab label="模型管理" id="service-tab-1" aria-controls="service-tabpanel-1" />
          </Tabs>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* 接口管理Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              添加接口
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={fetchInterfaces}
            >
              刷新
            </Button>
          </Box>

          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>接口地址</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>当前任务</TableCell>
                    <TableCell align="right">总请求数</TableCell>
                    <TableCell align="right">成功数</TableCell>
                    <TableCell align="right">失败数</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && interfaces.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress size={24} sx={{ my: 3 }} />
                      </TableCell>
                    </TableRow>
                  ) : interfaces.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    interfaces.map((interfaceItem) => (
                      <TableRow key={interfaceItem.id}>
                        <TableCell>{interfaceItem.interfaceAddress}</TableCell>
                        <TableCell>
                          <Chip 
                            label={getStatusLabel(interfaceItem.status)} 
                            color={getStatusColor(interfaceItem.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {interfaceItem.currentTaskId ? `#${interfaceItem.currentTaskId} ${interfaceItem.currentTaskMessage || ''}` : '无'}
                        </TableCell>
                        <TableCell align="right">{interfaceItem.requestCnt || 0}</TableCell>
                        <TableCell align="right">{interfaceItem.succCnt || 0}</TableCell>
                        <TableCell align="right">{interfaceItem.failCnt || 0}</TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditInterfaceItem(interfaceItem)}
                            color="primary"
                            title="编辑接口"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteInterface(interfaceItem.id)}
                            color="error"
                            title="删除接口"
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        {/* 模型管理Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleOpenAddModelDialog}
            >
              添加模型
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={fetchModels}
            >
              刷新
            </Button>
          </Box>

          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>模型名称</TableCell>
                    <TableCell>显示别名</TableCell>
                    <TableCell>描述</TableCell>
                    <TableCell align="right">使用次数</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && models.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress size={24} sx={{ my: 3 }} />
                      </TableCell>
                    </TableRow>
                  ) : models.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell>{model.modelName}</TableCell>
                        <TableCell>{model.modelAlias || '-'}</TableCell>
                        <TableCell>{model.modelDescription || '-'}</TableCell>
                        <TableCell align="right">{model.modelUsageCnt}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="编辑模型">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditModelItem(model)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="删除模型">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteModel(model.id)}
                              color="error"
                              sx={{ ml: 1 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>
      </Box>

      {/* 添加接口对话框 */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加接口</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="接口地址"
              name="interfaceAddress"
              value={formData.interfaceAddress}
              onChange={handleFormChange}
              placeholder="例如: http://localhost:5000"
              helperText="输入接口完整URL地址，包含协议和端口"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleFormChange}
                  name="isActive"
                  color="primary"
                />
              }
              label="立即启用此接口"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>取消</Button>
          <Button 
            onClick={handleSubmitAdd} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '添加'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑接口对话框 */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑接口</DialogTitle>
        <DialogContent>
          {editInterfaceItem && (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="接口地址"
                name="interfaceAddress"
                value={formData.interfaceAddress}
                onChange={handleFormChange}
                placeholder="例如: http://localhost:5000"
                helperText={
                  formData.interfaceAddress !== editInterfaceItem.interfaceAddress ? 
                  "注意: 修改地址将创建新接口，无法修改原接口地址" : ""
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label={formData.isActive ? "接口已启用" : "接口已禁用"}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>取消</Button>
          <Button 
            onClick={handleSubmitEdit} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 添加模型对话框 */}
      <Dialog open={openAddModelDialog} onClose={() => setOpenAddModelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加模型</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="模型名称"
              name="modelName"
              value={modelFormData.modelName}
              onChange={handleModelFormChange}
              placeholder="例如: BEN2_Base"
              helperText="输入模型的实际名称（用于后端识别）"
            />
            
            <TextField
              margin="normal"
              fullWidth
              label="显示别名"
              name="modelAlias"
              value={modelFormData.modelAlias}
              onChange={handleModelFormChange}
              placeholder="例如: 李白"
              helperText="输入模型的前端显示名称（用于用户选择）"
            />
            
            <TextField
              margin="normal"
              fullWidth
              label="模型描述"
              name="modelDescription"
              value={modelFormData.modelDescription}
              onChange={handleModelFormChange}
              multiline
              rows={2}
              placeholder="例如: 准确率高、模型推理时间长"
              helperText="简要描述模型特点，帮助用户选择"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddModelDialog(false)}>取消</Button>
          <Button 
            onClick={handleSubmitAddModel} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '添加'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑模型对话框 */}
      <Dialog open={openEditModelDialog} onClose={() => setOpenEditModelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑模型</DialogTitle>
        <DialogContent>
          {editModelItem && (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="模型名称"
                name="modelName"
                value={modelFormData.modelName}
                onChange={handleModelFormChange}
                placeholder="例如: BEN2_Base"
                helperText="输入模型的实际名称（用于后端识别）"
              />
              
              <TextField
                margin="normal"
                fullWidth
                label="显示别名"
                name="modelAlias"
                value={modelFormData.modelAlias}
                onChange={handleModelFormChange}
                placeholder="例如: 李白"
                helperText="输入模型的前端显示名称（用于用户选择）"
              />
              
              <TextField
                margin="normal"
                fullWidth
                label="模型描述"
                name="modelDescription"
                value={modelFormData.modelDescription}
                onChange={handleModelFormChange}
                multiline
                rows={2}
                placeholder="例如: 准确率高、模型推理时间长"
                helperText="简要描述模型特点，帮助用户选择"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModelDialog(false)}>取消</Button>
          <Button 
            onClick={handleSubmitEditModel} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AIServiceManagement; 