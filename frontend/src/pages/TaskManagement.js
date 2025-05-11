import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Tabs, Tab, Paper, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  FormControl, InputLabel, Select, MenuItem, IconButton, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import { getAllTasks, updateTask, deleteTask } from '../services/adminService';

// Tab面板组件
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TaskManagement = () => {
  // 状态
  const [tabValue, setTabValue] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 编辑相关状态
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [formData, setFormData] = useState({
    taskStatus: '',
    taskProgress: 0,
    taskRespose: '',
    interfaceAddress: ''
  });

  // 状态与Tab索引的映射
  const statusTabs = ['waiting', 'processing', 'completed', 'failed'];

  useEffect(() => {
    fetchTasks(statusTabs[tabValue]);
  }, [tabValue]);

  // 处理Tab变化
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 获取任务列表
  const fetchTasks = async (status) => {
    setError('');
    setLoading(true);
    try {
      const data = await getAllTasks(status);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取任务列表失败:', error);
      setError(`获取任务列表失败: ${error.response?.data?.message || error.message}`);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑按钮点击
  const handleEditTask = (task) => {
    setEditTask(task);
    setFormData({
      taskStatus: task.taskStatus,
      taskProgress: task.taskProgress || 0,
      taskRespose: task.taskRespose || '',
      interfaceAddress: task.interfaceAddress || ''
    });
    setOpenEditDialog(true);
  };

  // 处理表单变化
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 提交任务编辑
  const handleSubmitEdit = async () => {
    setLoading(true);
    setError('');
    try {
      await updateTask(editTask.id, formData);
      setOpenEditDialog(false);
      fetchTasks(statusTabs[tabValue]); // 重新获取当前状态的任务
    } catch (error) {
      console.error('更新任务失败:', error);
      setError(`更新任务失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理删除任务
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('确定要删除这个任务吗？')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await deleteTask(taskId);
      fetchTasks(statusTabs[tabValue]); // 重新获取当前状态的任务
    } catch (error) {
      console.error('删除任务失败:', error);
      setError(`删除任务失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 获取状态标签颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // 获取状态显示文本
  const getStatusLabel = (status) => {
    switch (status) {
      case 'waiting': return '等待中';
      case 'processing': return '处理中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      default: return status;
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未知';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          任务管理
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="任务管理选项卡">
            <Tab label="待处理任务" id="task-tab-0" aria-controls="task-tabpanel-0" />
            <Tab label="处理中任务" id="task-tab-1" aria-controls="task-tabpanel-1" />
            <Tab label="已完成任务" id="task-tab-2" aria-controls="task-tabpanel-2" />
            <Tab label="失败任务" id="task-tab-3" aria-controls="task-tabpanel-3" />
          </Tabs>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* 不同状态的任务Tab面板 */}
        {statusTabs.map((status, index) => (
          <TabPanel key={status} value={tabValue} index={index}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />}
                onClick={() => fetchTasks(status)}
              >
                刷新
              </Button>
            </Box>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <TableContainer sx={{ maxHeight: 640 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>用户邮箱</TableCell>
                      <TableCell>接口地址</TableCell>
                      <TableCell>视频ID</TableCell>
                      <TableCell>背景ID</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell>进度</TableCell>
                      <TableCell>任务响应</TableCell>
                      <TableCell>创建时间</TableCell>
                      <TableCell>更新时间</TableCell>
                      <TableCell>费用</TableCell>
                      <TableCell>模型</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={13} align="center">
                          <CircularProgress size={24} sx={{ my: 3 }} />
                        </TableCell>
                      </TableRow>
                    ) : tasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} align="center">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{task.id}</TableCell>
                          <TableCell>{task.email}</TableCell>
                          <TableCell>{task.interfaceAddress}</TableCell>
                          <TableCell>{task.oriVideoId}</TableCell>
                          <TableCell>{task.backgroundId}</TableCell>
                          <TableCell>
                            <Chip 
                              label={getStatusLabel(task.taskStatus)} 
                              color={getStatusColor(task.taskStatus)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{task.taskProgress}%</TableCell>
                          <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.taskRespose || '-'}
                          </TableCell>
                          <TableCell>{formatDate(task.taskStartTime)}</TableCell>
                          <TableCell>{formatDate(task.taskUpdateTime)}</TableCell>
                          <TableCell>{task.taskCost || 0}</TableCell>
                          <TableCell>{task.modelAlias || task.modelName || '-'}</TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditTask(task)}
                              color="primary"
                              title="编辑任务"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteTask(task.id)}
                              color="error"
                              title="删除任务"
                              sx={{ ml: 1 }}
                              disabled={task.taskStatus === 'processing'}
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
        ))}
      </Box>

      {/* 编辑任务对话框 */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑任务</DialogTitle>
        <DialogContent>
          {editTask && (
            <Box component="form" sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>任务ID: {editTask.id}</Typography>
              <Typography variant="body2" gutterBottom>用户: {editTask.email}</Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>任务状态</InputLabel>
                <Select
                  name="taskStatus"
                  value={formData.taskStatus}
                  onChange={handleFormChange}
                  label="任务状态"
                >
                  <MenuItem value="waiting">等待中</MenuItem>
                  <MenuItem value="processing">处理中</MenuItem>
                  <MenuItem value="completed">已完成</MenuItem>
                  <MenuItem value="failed">失败</MenuItem>
                </Select>
              </FormControl>

              <TextField
                margin="normal"
                fullWidth
                label="任务进度"
                name="taskProgress"
                type="number"
                value={formData.taskProgress}
                onChange={handleFormChange}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                helperText="任务进度百分比 (0-100)"
              />

              <TextField
                margin="normal"
                fullWidth
                label="任务响应"
                name="taskRespose"
                value={formData.taskRespose}
                onChange={handleFormChange}
                multiline
                rows={2}
              />

              <TextField
                margin="normal"
                fullWidth
                label="接口地址"
                name="interfaceAddress"
                value={formData.interfaceAddress}
                onChange={handleFormChange}
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
    </Container>
  );
};

export default TaskManagement; 