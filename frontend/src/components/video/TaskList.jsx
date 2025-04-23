import React, { useState, useRef, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Visibility
} from '@mui/icons-material';
import { getAllTasksV2 } from '../../services/videoService.js';
import { AuthContext } from '../../contexts/AuthContext.js';
import { API_BASE_URL } from '../../config.js';
import dayjs from 'dayjs';
import { DATE_SECOND_FORMAT } from '../../constants/index.ts';
import { MODEL_TYPE_MAP } from '../../constants/maps.ts';
import { useInfiniteScroll } from 'ahooks';
import InfiniteScrollList from '../common/InfiniteScrollList.jsx';

const statusColors = {
  waiting: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error'
};

const statusTranslations = {
  waiting: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败'
};

const pageSize = 10;

const TaskList = React.forwardRef((props, ref) => {
  const {activeTab, setError } = props
  const { currentUser } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const taskContainerRef = useRef(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  // 添加 refreshCount 状态
  const [refreshCount, setRefreshCount] = useState(0);


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

// 监听任务状态
useEffect(() => {
  const hasWaitingTasks = tasks.some(task => task.status === 'waiting');
  if (hasWaitingTasks) {
    startRefreshInterval();
  } else {
    clearRefreshInterval();
  }
  return () => clearRefreshInterval();
}, [tasks]);

  const fetchTasks = async (page = 1, size = pageSize) => {
    try {
      return await getAllTasksV2({
        userId: currentUser.id,
        pageNum: page,
        pageSize: size
      });
    } catch (error) {
      setError('获取任务列表失败。请重试。');
      console.error('获取任务列表失败:', error);
      return { list: [], total: 0, hasNextPage: false };
    }
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format(DATE_SECOND_FORMAT);
  };

  const getStatusDisplay = (status) => {
    return (
      <Chip
        label={statusTranslations[status] || status}
        color={statusColors[status] || 'default'}
        size="small"
        sx={{ textTransform: 'capitalize' }}
      />
    );
  };

  const getTaskProgress = (task) => {
    let progress = 0;
    let statusText = '';

    switch (task.status) {
      case 'waiting':
        progress = 0;
        statusText = '等待处理';
        break;
      case 'processing':
        progress = task.progress || 50;
        statusText = `处理中 (${progress}%)`;
        break;
      case 'completed':
        progress = 100;
        statusText = '已完成';
        break;
      case 'failed':
        progress = 0;
        statusText = '处理失败';
        break;
      default:
        statusText = task.status;
    }

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">{statusText}</Typography>
          <Typography variant="body2">{progress}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          color={task.status === 'failed' ? 'error' : 'primary'}
        />
      </Box>
    );
  };

  const refreshData = async () => {
    try {
      const taskResult = await fetchTasks(1);
      setTasks(taskResult.list);
      setRefreshCount(prev => prev + 1);
      // 数据更新后滚动到顶部
      if (taskContainerRef.current) {
        taskContainerRef.current.scrollTop = 0;
      }
    } catch (error) {
      console.error('刷新任务列表失败:', error);
    }
  };

  // 将刷新方法挂载到组件实例上
  React.useImperativeHandle(ref, () => ({
    refreshData
  }));

  return (
    <div ref={taskContainerRef} style={{
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 250px)',
      marginBottom: '20px',
      paddingBottom: '30px' // 添加底部内边距
    }}>
      <Box sx={{ mb: 3 }}>
        <Button
          variant='contained'
          color='primary'
          component={Link}
          to='/upload'
          startIcon={<Add />}
        >
          创建任务
        </Button>
      </Box>

      <Grid container spacing={3}>
        <InfiniteScrollList
          fetchData={fetchTasks}
          containerRef={taskContainerRef}
          // 更新 reloadDeps 依赖项
          reloadDeps={[activeTab, refreshCount]}
          initialData={tasks} // 传递初始数据
          renderItem={(task) => (
            <Grid item xs={12} sm={6} key={task.id}>
              <Card sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                width: 300, // 固定宽度
                maxWidth: '100%'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Tooltip title={task.videoName || `任务 ${String(task.id).substring(0, 8)}`} arrow>
                      <Typography variant='subtitle1' component='div' noWrap>
                        {task.videoName || `任务 ${String(task.id).substring(0, 8)}`}
                      </Typography>
                    </Tooltip>
                    {getStatusDisplay(task.status)}
                  </Box>

                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    创建于 {formatDate(task.startTime)}
                  </Typography>

                  <Box sx={{ my: 2 }}>{getTaskProgress(task)}</Box>

                  <Typography variant='body2' color='text.secondary'>
                    模型: {MODEL_TYPE_MAP[task.modelType] || '标准'}
                  </Typography>

                  {task.backgroundImage && (
                    <Typography variant='body2' color='text.secondary'>
                      自定义背景: 已设置
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ mt: 'auto' }}>
                  {task.status === 'completed' && (
                    <Button
                      size='small'
                      color='primary'
                      component={Link}
                      to={`/videos/${task.videoId}`}
                      startIcon={<Visibility />}
                    >
                      查看结果
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          )}
        />
      </Grid>
    </div>
  );
});


export default TaskList;
