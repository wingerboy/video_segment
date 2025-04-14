import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
  Card,
  CardMedia
} from '@mui/material';
import { CloudUpload, Wallpaper } from '@mui/icons-material';
import { uploadVideo, uploadBackgroundImage } from '../../services/videoService';

const steps = ['Upload Video', 'Upload Background (Optional)', 'Processing'];

const VideoUpload = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [backgroundPreview, setBackgroundPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [applyBackground, setApplyBackground] = useState(true);
  
  const videoInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const navigate = useNavigate();

  // Handle video file selection
  const handleVideoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  // Handle background image selection
  const handleBackgroundChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedBackground(file);
      setBackgroundPreview(URL.createObjectURL(file));
    }
  };

  // Handle video upload
  const handleVideoUpload = async () => {
    if (!selectedVideo) {
      setError('Please select a video to upload');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Upload video
      const uploadedVideo = await uploadVideo(selectedVideo);
      setVideoId(uploadedVideo.id);
      
      // Move to next step
      setActiveStep(1);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle background upload
  const handleBackgroundUpload = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (selectedBackground && applyBackground) {
        // Upload background if selected
        await uploadBackgroundImage(videoId, selectedBackground);
      }
      
      // Move to processing step
      setActiveStep(2);
      
      // Redirect to video details page after a short delay
      setTimeout(() => {
        navigate(`/videos/${videoId}`);
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload background. Please try again.');
      setLoading(false);
    }
  };

  // Skip background upload
  const handleSkipBackground = () => {
    setActiveStep(2);
    
    // Redirect to video details page after a short delay
    setTimeout(() => {
      navigate(`/videos/${videoId}`);
    }, 3000);
  };

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <input
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              ref={videoInputRef}
              onChange={handleVideoChange}
            />
            
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => videoInputRef.current.click()}
              sx={{ mb: 3 }}
            >
              Select Video
            </Button>
            
            {videoPreview && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Video:
                </Typography>
                <Card sx={{ maxWidth: 600, mx: 'auto' }}>
                  <CardMedia
                    component="video"
                    controls
                    src={videoPreview}
                    sx={{ maxHeight: 300 }}
                  />
                </Card>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {selectedVideo?.name} ({(selectedVideo?.size / (1024 * 1024)).toFixed(2)} MB)
                </Typography>
              </Box>
            )}
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleVideoUpload}
              disabled={!selectedVideo || loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Upload Video'}
            </Button>
          </Box>
        );
        
      case 1:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" gutterBottom>
              Would you like to add a custom background?
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={applyBackground}
                  onChange={(e) => setApplyBackground(e.target.checked)}
                />
              }
              label="Apply custom background"
              sx={{ mb: 2 }}
            />
            
            {applyBackground && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={backgroundInputRef}
                  onChange={handleBackgroundChange}
                />
                
                <Button
                  variant="contained"
                  startIcon={<Wallpaper />}
                  onClick={() => backgroundInputRef.current.click()}
                  sx={{ mb: 3 }}
                >
                  Select Background Image
                </Button>
                
                {backgroundPreview && (
                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Selected Background:
                    </Typography>
                    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
                      <CardMedia
                        component="img"
                        image={backgroundPreview}
                        sx={{ height: 300, objectFit: 'contain' }}
                      />
                    </Card>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {selectedBackground?.name} ({(selectedBackground?.size / (1024 * 1024)).toFixed(2)} MB)
                    </Typography>
                  </Box>
                )}
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleSkipBackground}
                disabled={loading}
              >
                Skip
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleBackgroundUpload}
                disabled={(applyBackground && !selectedBackground) || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Continue'}
              </Button>
            </Box>
          </Box>
        );
        
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress size={60} />
            </Box>
            <Typography variant="h6" gutterBottom>
              Processing Your Video
            </Typography>
            <Typography variant="body1" color="textSecondary">
              This may take a few minutes. You will be redirected when ready.
            </Typography>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Upload Video
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, mt: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {getStepContent(activeStep)}
      </Paper>
    </Container>
  );
};

export default VideoUpload; 