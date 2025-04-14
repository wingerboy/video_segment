import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert
} from '@mui/material';
import { Delete, MovieFilter, Visibility, Add } from '@mui/icons-material';
import { getAllVideos, deleteVideo } from '../../services/videoService';

const statusColors = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error'
};

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  // Fetch all videos when component mounts
  useEffect(() => {
    fetchVideos();
  }, []);

  // Fetch videos from API
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllVideos();
      setVideos(data || []);
    } catch (error) {
      setError('Failed to load videos. Please try again later.');
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (video) => {
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setVideoToDelete(null);
  };

  // Delete video
  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;
    
    try {
      await deleteVideo(videoToDelete.id);
      setVideos(videos.filter(video => video.id !== videoToDelete.id));
      handleDeleteClose();
    } catch (error) {
      setError('Failed to delete video. Please try again.');
      console.error('Error deleting video:', error);
    }
  };

  // Video thumbnail or placeholder
  const getVideoThumbnail = (video) => {
    if (video.finalVideo) {
      return `http://localhost:5000/${video.finalVideo}`;
    } else if (video.extractedForeground) {
      return `http://localhost:5000/${video.extractedForeground}`;
    } else if (video.originalVideo) {
      return `http://localhost:5000/${video.originalVideo}`;
    }
    return 'https://via.placeholder.com/320x180?text=No+Preview';
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Video status display
  const getStatusDisplay = (status) => {
    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={statusColors[status] || 'default'}
        size="small"
        sx={{ textTransform: 'capitalize' }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            My Videos
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/upload"
            startIcon={<Add />}
          >
            Upload New Video
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {videos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <MovieFilter sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No videos yet
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Upload your first video to get started!
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/upload"
              startIcon={<Add />}
            >
              Upload Video
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {videos.map((video) => (
              <Grid item xs={12} sm={6} md={4} key={video.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardActionArea component={Link} to={`/videos/${video.id}`}>
                    <CardMedia
                      component="img"
                      height="180"
                      image={getVideoThumbnail(video)}
                      alt="Video thumbnail"
                    />
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" component="div" noWrap>
                          Video {video.id.substring(0, 8)}
                        </Typography>
                        {getStatusDisplay(video.status)}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Uploaded on {formatDate(video.createdAt)}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  <CardActions sx={{ mt: 'auto' }}>
                    <Button
                      size="small"
                      color="primary"
                      component={Link}
                      to={`/videos/${video.id}`}
                      startIcon={<Visibility />}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(video)}
                      startIcon={<Delete />}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteClose}
      >
        <DialogTitle>Delete Video</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this video? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VideoList; 