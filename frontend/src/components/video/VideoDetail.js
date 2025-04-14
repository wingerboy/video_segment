import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  CloudDownload,
  Delete,
  Refresh,
  PhotoLibrary,
  Movie,
  CheckCircleOutline,
} from '@mui/icons-material';
import { getVideoById, uploadBackgroundImage, deleteVideo } from '../../services/videoService';

const statusColors = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error'
};

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const backgroundInputRef = useRef(null);
  
  // Polling interval for status updates (every 5 seconds)
  const POLLING_INTERVAL = 5000;
  let pollingTimer = null;
  
  // Fetch video details when component mounts
  useEffect(() => {
    fetchVideo();
    
    // Start polling if video is in pending or processing state
    startPolling();
    
    // Cleanup on unmount
    return () => {
      clearInterval(pollingTimer);
    };
  }, [id]);
  
  // Start polling for status updates
  const startPolling = () => {
    pollingTimer = setInterval(() => {
      if (video && (video.status === 'pending' || video.status === 'processing')) {
        fetchVideo(false);
      } else {
        clearInterval(pollingTimer);
      }
    }, POLLING_INTERVAL);
  };
  
  // Fetch video details from API
  const fetchVideo = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError('');
      const data = await getVideoById(id);
      setVideo(data);
      
      // Stop polling if video processing is complete or failed
      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(pollingTimer);
      }
    } catch (error) {
      setError('Failed to load video details. Please try again.');
      console.error('Error fetching video details:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };
  
  // Handle background image upload
  const handleBackgroundUpload = async (event) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    try {
      setUploadingBackground(true);
      setError('');
      
      await uploadBackgroundImage(id, file);
      
      // Refresh video data
      await fetchVideo(false);
      
      // Start polling for status updates
      startPolling();
    } catch (error) {
      setError('Failed to upload background image. Please try again.');
      console.error('Error uploading background:', error);
    } finally {
      setUploadingBackground(false);
    }
  };
  
  // Handle video deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      try {
        await deleteVideo(id);
        navigate('/dashboard');
      } catch (error) {
        setError('Failed to delete video. Please try again.');
        console.error('Error deleting video:', error);
      }
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!video) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">Video not found or has been deleted.</Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')} 
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard')} 
            startIcon={<ArrowBack />}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Video Details
          </Typography>
          <Chip 
            label={video.status.charAt(0).toUpperCase() + video.status.slice(1)}
            color={statusColors[video.status] || 'default'}
            sx={{ ml: 2 }}
          />
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          {/* Processing status */}
          {(video.status === 'pending' || video.status === 'processing') && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'center' }}>
              <CircularProgress size={30} sx={{ mb: 1 }} />
              <Typography variant="body1">
                {video.status === 'pending' ? 'Waiting for processing...' : 'Processing your video...'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This may take a few minutes. The page will automatically update.
              </Typography>
            </Box>
          )}
          
          {/* Error status */}
          {video.status === 'failed' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Processing failed. Please try uploading your video again.
            </Alert>
          )}
          
          <Grid container spacing={4}>
            {/* Video display */}
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                {video.finalVideo ? 'Final Video with Custom Background' : 'Original Video'}
              </Typography>
              
              <Card sx={{ mb: 2 }}>
                <CardMedia
                  component="video"
                  controls
                  sx={{ width: '100%', maxHeight: '400px' }}
                  src={`http://localhost:5000/${video.finalVideo || video.originalVideo}`}
                />
              </Card>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudDownload />}
                  href={`http://localhost:5000/${video.finalVideo || video.originalVideo}`}
                  download
                  disabled={!video.finalVideo && !video.originalVideo}
                >
                  Download Video
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </Box>
            </Grid>
            
            {/* Video info and background upload */}
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom>
                Video Information
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Uploaded on {formatDate(video.createdAt)}
                </Typography>
                {video.updatedAt && video.updatedAt !== video.createdAt && (
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {formatDate(video.updatedAt)}
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* Processing Status */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Processing Steps:
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleOutline color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2">Original video uploaded</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {video.extractedForeground ? (
                    <CheckCircleOutline color="success" sx={{ mr: 1 }} />
                  ) : video.status === 'processing' ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : (
                    <CheckCircleOutline color="disabled" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="body2">
                    Foreground extraction {video.extractedForeground ? 'completed' : video.status === 'processing' ? 'in progress' : 'pending'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {video.finalVideo ? (
                    <CheckCircleOutline color="success" sx={{ mr: 1 }} />
                  ) : video.backgroundImage && video.status === 'processing' ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : (
                    <CheckCircleOutline color="disabled" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="body2">
                    Background replacement {video.finalVideo ? 'completed' : (video.backgroundImage && video.status === 'processing') ? 'in progress' : 'pending'}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* Background Image Upload */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Custom Background
                </Typography>
                
                {video.backgroundImage ? (
                  <Box>
                    <Card sx={{ mb: 2 }}>
                      <CardMedia
                        component="img"
                        sx={{ height: '200px', objectFit: 'contain' }}
                        image={`http://localhost:5000/${video.backgroundImage}`}
                        alt="Background image"
                      />
                    </Card>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoLibrary />}
                      onClick={() => backgroundInputRef.current.click()}
                      disabled={uploadingBackground || video.status === 'processing'}
                      fullWidth
                    >
                      Change Background
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No background image uploaded yet. Upload an image to replace the video background.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoLibrary />}
                      onClick={() => backgroundInputRef.current.click()}
                      disabled={uploadingBackground || video.status === 'processing' || !video.extractedForeground}
                      fullWidth
                    >
                      {uploadingBackground ? <CircularProgress size={24} /> : 'Upload Background Image'}
                    </Button>
                    {!video.extractedForeground && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Wait for foreground extraction to complete before uploading a background.
                      </Typography>
                    )}
                  </Box>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={backgroundInputRef}
                  onChange={handleBackgroundUpload}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default VideoDetail; 