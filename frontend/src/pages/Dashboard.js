import React, { useState } from 'react';
import { Box, Tabs, Tab, Container } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import VideoList from '../components/video/VideoList';
import TaskList from '../components/tasks/TaskList';
import BackgroundList from '../components/backgrounds/BackgroundList';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine initial tab based on URL hash or default to 0
  const getInitialTab = () => {
    const hash = location.hash.replace('#', '');
    if (hash === 'videos') return 1;
    if (hash === 'backgrounds') return 2;
    return 0; // default to media tab
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Update URL hash without triggering full navigation
    const paths = ['tasks', 'videos', 'backgrounds'];
    navigate(`/dashboard#${paths[newValue]}`, { replace: true });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="仪表盘选项卡"
            centered
          >
            <Tab label="任务列表" id="dashboard-tab-0" aria-controls="dashboard-tabpanel-0" />
            <Tab label="视频库" id="dashboard-tab-1" aria-controls="dashboard-tabpanel-1" />
            <Tab label="背景素材" id="dashboard-tab-2" aria-controls="dashboard-tabpanel-2" />
          </Tabs>
        </Box>
        
        <TabPanel value={activeTab} index={0}>
          <TaskList />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <VideoList />
        </TabPanel>        
        <TabPanel value={activeTab} index={2}>
          <BackgroundList />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default Dashboard; 