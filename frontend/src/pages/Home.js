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
  useTheme,
  useMediaQuery,
  Divider,
  alpha,
} from '@mui/material';
import {
  VideoLibrary,
  Brush,
  Speed,
  CloudUpload,
  Movie,
  PhotoLibrary,
  ArrowForward,
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section with Gradient Background */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          pt: { xs: 10, md: 14 },
          pb: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={6} sx={{ zIndex: 1 }}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  mb: 3
                }}
              >
                视频分割
              </Typography>
              <Typography 
                variant="h5" 
                component="div" 
                sx={{ 
                  mb: 4, 
                  fontWeight: 400,
                  lineHeight: 1.5,
                  maxWidth: '90%',
                  opacity: 0.9
                }}
              >
                只需几步，即可提取视频前景并应用自定义背景。
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                {currentUser ? (
                  <Button
                    component={Link}
                    to="/dashboard"
                    variant="contained"
                    color="secondary"
                    size="large"
                    sx={{ 
                      py: 1.5, 
                      px: 4, 
                      borderRadius: 2,
                      fontWeight: 600,
                      boxShadow: '0 8px 16px rgba(245, 0, 87, 0.2)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 20px rgba(245, 0, 87, 0.3)'
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    endIcon={<ArrowForward />}
                  >
                    进入仪表盘
                  </Button>
                ) : (
                  <>
                    <Button
                      component={Link}
                      to="/register"
                      variant="contained"
                      color="secondary"
                      size="large"
                      sx={{ 
                        py: 1.5, 
                        px: 4, 
                        borderRadius: 2,
                        fontWeight: 600,
                        boxShadow: '0 8px 16px rgba(245, 0, 87, 0.2)',
                        flexGrow: { xs: 1, sm: 0 },
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 10px 20px rgba(245, 0, 87, 0.3)'
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                      endIcon={<ArrowForward />}
                    >
                      开始使用
                    </Button>
                    <Button
                      component={Link}
                      to="/login"
                      variant="outlined"
                      color="inherit"
                      size="large"
                      sx={{ 
                        py: 1.5, 
                        px: 4, 
                        borderRadius: 2,
                        fontWeight: 600,
                        borderWidth: 2,
                        flexGrow: { xs: 1, sm: 0 },
                        '&:hover': {
                          borderWidth: 2,
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      登录
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            <Grid 
              item 
              xs={12} 
              md={6} 
              sx={{ 
                position: 'relative',
                display: { xs: 'none', md: 'block' }
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -15,
                    left: -15,
                    right: 15,
                    bottom: 15,
                    backgroundColor: alpha(theme.palette.primary.light, 0.3),
                    borderRadius: 4,
                    zIndex: 0
                  }
                }}
              >
                <Paper
                  elevation={6}
                  sx={{
                    borderRadius: 4,
                    overflow: 'hidden',
                    width: '100%',
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                  }}
                >
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1536240478700-b869070f9279?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                    alt="视频编辑"
                    sx={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 6, md: 10 },
          px: { xs: 2, sm: 3, md: 'auto' }
        }}
      >
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          sx={{ 
            fontWeight: 700,
            mb: 2,
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          功能特点
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: { xs: 5, md: 8 }, maxWidth: '700px', mx: 'auto', px: 2 }}
        >
          简单易用的强大视频分割工具
        </Typography>

        <Grid container spacing={4}>
          {/* Feature 1 */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }
              }}
              elevation={3}
            >
              <Box 
                sx={{ 
                  p: 3, 
                  display: 'flex', 
                  justifyContent: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: '24px 24px 0 0'
                }}
              >
                <VideoLibrary sx={{ fontSize: 70, color: 'primary.main' }} />
              </Box>
              <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                <Typography variant="h5" component="div" gutterBottom textAlign="center" fontWeight={600}>
                  视频前景提取
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  我们的高级AI技术可以自动从视频中提取前景主体，保持高精度，并保留头发和透明物体等精细细节。
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 2 */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }
              }}
              elevation={3}
            >
              <Box 
                sx={{ 
                  p: 3, 
                  display: 'flex', 
                  justifyContent: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: '24px 24px 0 0'
                }}
              >
                <Brush sx={{ fontSize: 70, color: 'primary.main' }} />
              </Box>
              <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                <Typography variant="h5" component="div" gutterBottom textAlign="center" fontWeight={600}>
                  自定义背景
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  用您选择的任何图像替换视频背景。只需点击几下，即可为演示文稿、社交媒体或个人项目创建专业外观的视频。
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 3 */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }
              }}
              elevation={3}
            >
              <Box 
                sx={{ 
                  p: 3, 
                  display: 'flex', 
                  justifyContent: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: '24px 24px 0 0'
                }}
              >
                <Speed sx={{ fontSize: 70, color: 'primary.main' }} />
              </Box>
              <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                <Typography variant="h5" component="div" gutterBottom textAlign="center" fontWeight={600}>
                  快速处理
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  我们优化的云端处理确保您的视频能够快速处理，同时保持高质量结果，节省您的时间和精力。
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* How It Works Section with Accent Background */}
      <Box 
        sx={{ 
          background: alpha(theme.palette.primary.light, 0.05),
          py: { xs: 6, md: 10 },
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.primary.light, 0.1)} 1px, transparent 1px), linear-gradient(to bottom, ${alpha(theme.palette.primary.light, 0.1)} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            opacity: 0.4,
            pointerEvents: 'none'
          }
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            sx={{ 
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
              position: 'relative',
              zIndex: 1
            }}
          >
            工作原理
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: { xs: 5, md: 8 }, maxWidth: '700px', mx: 'auto', px: 2, position: 'relative', zIndex: 1 }}
          >
            三个简单步骤转换您的视频
          </Typography>

          <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
            {/* Step 1 */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={4}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  overflow: 'visible',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  <CloudUpload sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                
                <Typography variant="h5" component="h3" gutterBottom fontWeight={600}>
                  1. 上传视频
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, mt: 1 }}>
                  将您的视频文件上传到我们的安全平台。我们支持各种视频格式，包括MP4、MOV和AVI。
                </Typography>
              </Paper>
            </Grid>

            {/* Step 2 */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={4}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  overflow: 'visible',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  <Movie sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" component="h3" gutterBottom fontWeight={600}>
                  2. 提取前景
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, mt: 1 }}>
                  我们的AI会自动处理您的视频，精确地将前景主体与背景分离。
                </Typography>
              </Paper>
            </Grid>

            {/* Step 3 */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={4}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  overflow: 'visible',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  <PhotoLibrary sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" component="h3" gutterBottom fontWeight={600}>
                  3. 应用自定义背景
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, mt: 1 }}>
                  选择一个新的背景图像，我们的系统将它与您的视频前景合并以创建最终结果。
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Box 
            sx={{ 
              textAlign: 'center', 
              mt: { xs: 5, md: 8 },
              position: 'relative',
              zIndex: 1
            }}
          >
            {currentUser ? (
              <Button
                component={Link}
                to="/dashboard"
                variant="contained"
                color="primary"
                size="large"
                sx={{ 
                  py: 1.5, 
                  px: 4, 
                  borderRadius: 2,
                  fontWeight: 600,
                  boxShadow: '0 8px 16px rgba(63, 81, 181, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 20px rgba(63, 81, 181, 0.3)'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
                endIcon={<ArrowForward />}
              >
                进入仪表盘
              </Button>
            ) : (
              <Button
                component={Link}
                to="/register"
                variant="contained"
                color="primary"
                size="large"
                sx={{ 
                  py: 1.5, 
                  px: 4, 
                  borderRadius: 2,
                  fontWeight: 600,
                  boxShadow: '0 8px 16px rgba(63, 81, 181, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 20px rgba(63, 81, 181, 0.3)'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
                endIcon={<ArrowForward />}
              >
                立即试用
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      {/* Footer with gradient */}
      <Box 
        sx={{ 
          py: 6, 
          borderTop: 1, 
          borderColor: 'divider',
          background: `linear-gradient(to bottom, white, ${alpha(theme.palette.primary.light, 0.05)})`
        }}
      >
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