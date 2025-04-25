import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh',
      textAlign: 'center'
    }}>
      <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
        404
      </Typography>
      <Typography variant="h4" sx={{ mb: 4 }}>
        页面未找到
      </Typography>
      <Button 
        variant="contained" 
        component={Link} 
        to="/"
        size="large"
      >
        返回首页
      </Button>
    </Box>
  );
};

export default NotFound;