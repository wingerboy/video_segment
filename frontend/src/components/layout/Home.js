import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import {
  VideoLibrary,
  Brush,
  Speed,
  CloudUpload,
  Movie,
  PhotoLibrary,
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useContext(AuthContext);
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                视频分割
              </Typography>
              <Typography variant="h5" component="div" sx={{ mb: 4 }}>
                只需几步，即可提取视频前景并应用自定义背景。
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  component={Link}
                  to={ currentUser ? '/upload' : '/register'}
                  variant="contained"
                  color="secondary"
                  size="large"
                >
                  开始使用
                </Button>
                { !currentUser ?
                  (<Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  color="inherit"
                  size="large"
                >
                  登录
                </Button>) : null
                }
               
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <Paper
                  elevation={6}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    width: '100%',
                    maxWidth: '500px',
                  }}
                >
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1536240478700-b869070f9279?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                    alt="视频编辑"
                    sx={{
                      width: '100%',
                      height: 'auto',
                    }}
                  />
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
        >
          功能特点
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          简单易用的强大视频分割工具
        </Typography>

        <Grid container spacing={4}>
          {/* Feature 1 */}
          <Grid item size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <VideoLibrary sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="div" gutterBottom textAlign="center">
                  视频前景提取
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  我们的高级AI技术可以自动从视频中提取前景主体，保持高精度，并保留头发和透明物体等精细细节。
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 2 */}
          <Grid item size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Brush sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="div" gutterBottom textAlign="center">
                  自定义背景
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  用您选择的任何图像替换视频背景。只需点击几下，即可为演示文稿、社交媒体或个人项目创建专业外观的视频。
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 3 */}
          <Grid item size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Speed sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="div" gutterBottom textAlign="center">
                  快速处理
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  我们优化的云端处理确保您的视频能够快速处理，同时保持高质量结果，节省您的时间和精力。
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
          >
            工作原理
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            三个简单步骤转换您的视频
          </Typography>

          <Grid container spacing={4}>
            {/* Step 1 */}
            <Grid item size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
               <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <CloudUpload sx={{ fontSize: 50, color: 'primary.main' }} />
               </Box>
                
                <Typography variant="h5" component="h3" gutterBottom>
                  1. 上传视频
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  将您的视频文件上传到我们的安全平台。我们支持各种视频格式，包括MP4、MOV和AVI。
                </Typography>
              </Paper>
            </Grid>

            {/* Step 2 */}
            <Grid item size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
               <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                 <Movie sx={{ fontSize: 50, color: 'primary.main'}} />
               </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  2. 提取前景
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  我们的AI会自动处理您的视频，精确地将前景主体与背景分离。
                </Typography>
              </Paper>
            </Grid>

            {/* Step 3 */}
            <Grid item size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <PhotoLibrary sx={{ fontSize: 50, color: 'primary.main'}} />
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  3. 应用自定义背景
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  选择一个新的背景图像，我们的系统将它与您的视频前景合并以创建最终结果。
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              component={Link}
              to={ currentUser ? '/upload' : '/register'}
              variant="contained"
              color="primary"
              size="large"
            >
              立即试用
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 6, borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; {new Date().getFullYear()} 视频分割。保留所有权利。
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 