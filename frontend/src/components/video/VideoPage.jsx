import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Add,
  Refresh
} from '@mui/icons-material';
import VideoList from './VideoList.jsx';
import TaskList from './TaskList.jsx';
import BackgroundList from './BackgroundList.jsx';

const VideoPage = () => {
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const containerRef = useRef(null);
  const videoLibaryRef = useRef(null);
  const taskListRef = useRef(null);
  const backgroundListRef = useRef(null);

  const handleRefresh = () => {
    try {
      setError('');
      switch (activeTab) {
        case 0: // 视频库
          if (videoLibaryRef.current && videoLibaryRef.current.refreshData) {
            videoLibaryRef.current.refreshData();
          }
          break;
        case 1: // 任务列表
          if (taskListRef.current && taskListRef.current.refreshData) {
            taskListRef.current.refreshData();
          }
          break;
        case 2: // 背景库
          if (backgroundListRef.current && backgroundListRef.current.refreshData) {
            backgroundListRef.current.refreshData();
          }
          break;
        default:
          if (videoLibaryRef.current && videoLibaryRef.current.refreshData) {
            videoLibaryRef.current.refreshData();
          }
      }
      // 数据更新后滚动到顶部
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    } catch (error) {
      setError('数据加载失败。请重试。');
      console.error('数据加载错误:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    // 切换 tab 时重置滚动位置
    if (newValue === 0 && videoLibaryRef.current) {
      videoLibaryRef.current.scrollTop = 0;
    } else if (newValue === 1 && taskListRef.current) {
      taskListRef.current.scrollTop = 0;
    } else if (newValue === 2 && backgroundListRef.current) {
      backgroundListRef.current.scrollTop = 0;
    }
    setActiveTab(newValue);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <VideoList ref={videoLibaryRef} activeTab={activeTab} setError={setError} />;
      case 1:
        return <TaskList ref={taskListRef} activeTab={activeTab} setError={setError} />;
      case 2:
        return <BackgroundList ref={backgroundListRef} activeTab={activeTab} setError={setError} />;
      default:
        return <VideoList ref={videoLibaryRef} activeTab={activeTab} setError={setError} />;
    }
  };

  return (
    <Container maxWidth='lg'>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}
        >
          <Typography variant='h4' component='h1'>
            {activeTab === 0
              ? '我的视频'
              : activeTab === 1
                ? '任务列表'
                : '背景库'}
          </Typography>
          <Box>
            <Button
              variant='outlined'
              onClick={handleRefresh}
              startIcon={<Refresh />}
              sx={{ mr: 2 }}
            >
              刷新
            </Button>
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
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            sx={{ mb: 2 }}
          >
            <Tab label='视频库' />
            <Tab label='任务列表' />
            <Tab label='背景库' />
          </Tabs>
          <Divider />
        </Box>

        {renderTabContent()}
      </Box>
    </Container>
  );
};

export default VideoPage;
